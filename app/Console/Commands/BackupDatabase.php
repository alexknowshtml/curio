<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database {--retention-hours=24 : Hours to keep local backups}';
    protected $description = 'Backup SQLite database to DO Spaces with tiered retention';

    // Tiered retention policy (matches Andy Core)
    private const RETENTION_RECENT_HOURS = 24;  // Keep all backups from last 24 hours
    private const RETENTION_DAILY_DAYS = 7;     // Keep daily backups for 7 days
    private const RETENTION_WEEKLY_WEEKS = 4;   // Keep weekly backups for 4 weeks

    public function handle(): int
    {
        $this->info('Starting Curio database backup...');

        // Paths
        $dbPath = database_path('database.sqlite');
        $backupDir = storage_path('backups');
        $timestamp = Carbon::now('America/New_York')->format('Y-m-d\TH-i');
        $backupFile = "curio-{$timestamp}.sqlite.gz";
        $localPath = "{$backupDir}/{$backupFile}";

        // Ensure backup directory exists
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        // Check database exists
        if (!file_exists($dbPath)) {
            $this->error("Database not found at {$dbPath}");
            return 1;
        }

        // Create backup using SQLite's backup API (safe for concurrent access)
        $tempBackup = "{$backupDir}/temp-backup.sqlite";

        try {
            $this->info('Creating SQLite backup...');

            // Use SQLite .backup command for a consistent snapshot
            $result = shell_exec("sqlite3 '{$dbPath}' \".backup '{$tempBackup}'\" 2>&1");

            if (!file_exists($tempBackup)) {
                $this->error("SQLite backup failed: {$result}");
                return 1;
            }

            // Compress the backup
            $this->info('Compressing backup...');
            $gzContent = gzencode(file_get_contents($tempBackup), 9);
            file_put_contents($localPath, $gzContent);
            unlink($tempBackup);

            $sizeMB = round(filesize($localPath) / 1024 / 1024, 2);
            $this->info("Local backup created: {$backupFile} ({$sizeMB} MB)");

        } catch (\Exception $e) {
            $this->error("Backup failed: " . $e->getMessage());
            if (file_exists($tempBackup)) {
                unlink($tempBackup);
            }
            return 1;
        }

        // Upload to DO Spaces
        if ($this->hasS3Config()) {
            try {
                $this->info('Uploading to DO Spaces...');

                $s3Path = "backups/curio/{$backupFile}";
                Storage::disk('do-spaces')->put($s3Path, file_get_contents($localPath));

                $this->info("Uploaded to DO Spaces: {$s3Path}");

                // Apply tiered retention
                $this->applyTieredRetention();

            } catch (\Exception $e) {
                $this->error("DO Spaces upload failed: " . $e->getMessage());
                // Don't fail the whole command - local backup still succeeded
            }
        } else {
            $this->warn('DO Spaces not configured - skipping remote upload');
        }

        // Clean up old local backups
        $this->cleanLocalBackups($backupDir, (int) $this->option('retention-hours'));

        $this->info('Backup complete!');
        return 0;
    }

    private function hasS3Config(): bool
    {
        return !empty(config('filesystems.disks.do-spaces.key'))
            && !empty(config('filesystems.disks.do-spaces.secret'));
    }

    private function applyTieredRetention(): void
    {
        $this->info('Applying tiered retention policy...');

        $now = Carbon::now('UTC');
        $recentCutoff = $now->copy()->subHours(self::RETENTION_RECENT_HOURS);
        $dailyCutoff = $now->copy()->subDays(self::RETENTION_DAILY_DAYS);
        $weeklyCutoff = $now->copy()->subWeeks(self::RETENTION_WEEKLY_WEEKS);

        $disk = Storage::disk('do-spaces');
        $files = $disk->files('backups/curio');

        $backups = [];
        foreach ($files as $file) {
            $timestamp = $this->parseBackupTimestamp(basename($file));
            if ($timestamp) {
                $backups[] = ['key' => $file, 'timestamp' => $timestamp];
            }
        }

        // Sort newest first
        usort($backups, fn($a, $b) => $b['timestamp']->timestamp - $a['timestamp']->timestamp);

        $toDelete = [];
        $keptDaily = [];
        $keptWeekly = [];

        foreach ($backups as $backup) {
            $ts = $backup['timestamp'];

            // Recent tier: keep all
            if ($ts >= $recentCutoff) {
                continue;
            }

            // Daily tier: keep first backup per day
            if ($ts >= $dailyCutoff) {
                $dayKey = $ts->format('Y-m-d');
                if (!in_array($dayKey, $keptDaily)) {
                    $keptDaily[] = $dayKey;
                    continue;
                }
                $toDelete[] = $backup['key'];
                continue;
            }

            // Weekly tier: keep first backup per week
            if ($ts >= $weeklyCutoff) {
                $weekKey = $ts->format('Y-W');
                if (!in_array($weekKey, $keptWeekly)) {
                    $keptWeekly[] = $weekKey;
                    continue;
                }
                $toDelete[] = $backup['key'];
                continue;
            }

            // Older than all tiers: delete
            $toDelete[] = $backup['key'];
        }

        if (count($toDelete) > 0) {
            foreach ($toDelete as $key) {
                $disk->delete($key);
            }
            $this->info("Deleted " . count($toDelete) . " old backup(s) per retention policy");
        }
    }

    private function parseBackupTimestamp(string $filename): ?Carbon
    {
        // Format: curio-2025-12-08T14-40.sqlite.gz
        if (preg_match('/curio-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})\.sqlite\.gz$/', $filename, $matches)) {
            return Carbon::create($matches[1], $matches[2], $matches[3], $matches[4], $matches[5], 0, 'UTC');
        }
        return null;
    }

    private function cleanLocalBackups(string $dir, int $retentionHours): void
    {
        $cutoffTime = time() - ($retentionHours * 3600);
        $deleted = 0;

        foreach (glob("{$dir}/curio-*.sqlite.gz") as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            $this->info("Deleted {$deleted} old local backup(s)");
        }
    }
}

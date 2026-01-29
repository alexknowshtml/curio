<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Encrypt existing entry and draft content.
     *
     * This migration reads plaintext content, encrypts it using Laravel's
     * encryption (AES-256-CBC with APP_KEY), and writes it back.
     */
    public function up(): void
    {
        // Encrypt entries
        $entries = DB::table('entries')->get();
        foreach ($entries as $entry) {
            // Skip if already encrypted (starts with eyJ - base64 JSON)
            if ($entry->content && !str_starts_with($entry->content, 'eyJ')) {
                DB::table('entries')
                    ->where('id', $entry->id)
                    ->update([
                        'content' => Crypt::encryptString($entry->content),
                        'content_html' => $entry->content_html ? Crypt::encryptString($entry->content_html) : null,
                    ]);
            }
        }

        // Encrypt drafts
        $drafts = DB::table('drafts')->get();
        foreach ($drafts as $draft) {
            if ($draft->content && !str_starts_with($draft->content, 'eyJ')) {
                DB::table('drafts')
                    ->where('id', $draft->id)
                    ->update([
                        'content' => Crypt::encryptString($draft->content),
                    ]);
            }
        }
    }

    /**
     * Decrypt content back to plaintext.
     *
     * WARNING: Only run this if you're sure all content was encrypted by this migration.
     */
    public function down(): void
    {
        // Decrypt entries
        $entries = DB::table('entries')->get();
        foreach ($entries as $entry) {
            if ($entry->content && str_starts_with($entry->content, 'eyJ')) {
                try {
                    DB::table('entries')
                        ->where('id', $entry->id)
                        ->update([
                            'content' => Crypt::decryptString($entry->content),
                            'content_html' => $entry->content_html ? Crypt::decryptString($entry->content_html) : null,
                        ]);
                } catch (\Exception $e) {
                    // Skip entries that can't be decrypted
                }
            }
        }

        // Decrypt drafts
        $drafts = DB::table('drafts')->get();
        foreach ($drafts as $draft) {
            if ($draft->content && str_starts_with($draft->content, 'eyJ')) {
                try {
                    DB::table('drafts')
                        ->where('id', $draft->id)
                        ->update([
                            'content' => Crypt::decryptString($draft->content),
                        ]);
                } catch (\Exception $e) {
                    // Skip drafts that can't be decrypted
                }
            }
        }
    }
};

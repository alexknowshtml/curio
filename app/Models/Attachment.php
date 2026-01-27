<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    protected $fillable = [
        'entry_id',
        'type',
        'filename',
        'original_filename',
        'path',
        'mime_type',
        'size',
    ];

    protected $appends = ['url', 'human_size'];

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    /**
     * Get the public URL for this attachment
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }

    /**
     * Check if this attachment is an image
     */
    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    /**
     * Check if this attachment is a document (PDF)
     */
    public function isDocument(): bool
    {
        return $this->type === 'document';
    }

    /**
     * Check if this attachment is a text file
     */
    public function isText(): bool
    {
        return $this->type === 'text';
    }

    /**
     * Get the file contents (for text files)
     */
    public function getContents(): ?string
    {
        if (!$this->isText()) {
            return null;
        }
        return Storage::get($this->path);
    }

    /**
     * Determine attachment type from mime type
     */
    public static function determineType(string $mimeType): string
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        }

        if ($mimeType === 'application/pdf') {
            return 'document';
        }

        $textMimes = [
            'text/plain',
            'text/markdown',
            'text/x-markdown',
            'text/csv',
            'application/json',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript',
            'text/x-python',
            'text/x-shellscript',
        ];

        if (in_array($mimeType, $textMimes) || str_starts_with($mimeType, 'text/')) {
            return 'text';
        }

        return 'other';
    }

    /**
     * Get a human-readable file size
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 1) . ' ' . $units[$i];
    }
}

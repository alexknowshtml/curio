<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Image extends Model
{
    protected $fillable = [
        'entry_id',
        'filename',
        'path',
        'mime_type',
        'size',
    ];

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    /**
     * Get the public URL for this image
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->path);
    }
}

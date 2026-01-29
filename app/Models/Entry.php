<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entry extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'content_html',
        'has_images',
    ];

    protected $casts = [
        'has_images' => 'boolean',
    ];

    // Serialize created_at in America/New_York timezone for frontend
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->setTimezone(new \DateTimeZone('America/New_York'))->format('Y-m-d\TH:i:s.uP');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(Attachment::class)->where('type', 'image');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}

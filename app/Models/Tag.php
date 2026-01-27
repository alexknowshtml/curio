<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $fillable = [
        'sigil',
        'name',
    ];

    public function entries(): BelongsToMany
    {
        return $this->belongsToMany(Entry::class);
    }

    /**
     * Get the full tag string (sigil + name)
     */
    public function getFullAttribute(): string
    {
        return $this->sigil . $this->name;
    }
}

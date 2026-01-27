<?php

namespace App\Services;

use App\Models\Tag;

class TagParserService
{
    /**
     * Supported sigils and their meanings:
     * # = topic
     * @ = person
     * $ = product
     * ! = priority
     * ~ = project
     */
    protected array $sigils = ['#', '@', '$', '!', '~'];

    /**
     * Parse content and extract tags.
     * Returns array of ['sigil' => string, 'name' => string] pairs.
     */
    public function parse(string $content): array
    {
        $tags = [];
        $sigilPattern = preg_quote(implode('', $this->sigils), '/');

        // Match sigil followed by word characters (letters, numbers, underscores, hyphens)
        // Also supports multi-word tags in brackets: #[multi word tag]
        $pattern = '/([' . $sigilPattern . '])(\[([^\]]+)\]|[\w\-]+)/u';

        if (preg_match_all($pattern, $content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $sigil = $match[1];
                // If bracketed, use the content inside brackets; otherwise use the word
                $name = isset($match[3]) && $match[3] !== '' ? $match[3] : $match[2];
                // Clean up the name (remove brackets if present)
                $name = trim($name, '[]');

                if (!empty($name)) {
                    $tags[] = [
                        'sigil' => $sigil,
                        'name' => $name,
                    ];
                }
            }
        }

        // Remove duplicates
        return array_values(array_unique($tags, SORT_REGULAR));
    }

    /**
     * Sync tags for an entry.
     * Creates new tags if they don't exist, then attaches them to the entry.
     */
    public function syncTagsForEntry(\App\Models\Entry $entry): void
    {
        $parsedTags = $this->parse($entry->content);
        $tagIds = [];

        foreach ($parsedTags as $tagData) {
            $tag = Tag::firstOrCreate(
                [
                    'sigil' => $tagData['sigil'],
                    'name' => $tagData['name'],
                ],
            );
            $tagIds[] = $tag->id;
        }

        $entry->tags()->sync($tagIds);
    }
}

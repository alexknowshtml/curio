import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface TagAutocompleteProps {
    sigil: string;
    query: string;
    position: { top: number; left: number };
    onSelect: (tag: Tag | { sigil: string; name: string; isNew: true }) => void;
    onClose: () => void;
}

const sigilColors: Record<string, string> = {
    '#': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    '@': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const CACHE_KEY = 'curio_tags_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedTags {
    tags: Tag[];
    timestamp: number;
}

// Get cached tags from localStorage
function getCachedTags(): Tag[] {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return [];

        const { tags, timestamp }: CachedTags = JSON.parse(cached);

        // Return cached tags (we'll refresh in background if stale)
        return tags;
    } catch {
        return [];
    }
}

// Save tags to localStorage
function setCachedTags(tags: Tag[]) {
    try {
        const cache: CachedTags = { tags, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
        // localStorage might be full or disabled
    }
}

// Check if cache is stale
function isCacheStale(): boolean {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return true;

        const { timestamp }: CachedTags = JSON.parse(cached);
        return Date.now() - timestamp > CACHE_TTL;
    } catch {
        return true;
    }
}

// Refresh cache from server (call this in background)
export async function refreshTagCache() {
    try {
        const response = await axios.get('/api/tags');
        setCachedTags(response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to refresh tag cache:', error);
        return getCachedTags();
    }
}

export function TagAutocomplete({ sigil, query, position, onSelect, onClose }: TagAutocompleteProps) {
    const [allTags, setAllTags] = useState<Tag[]>(() => getCachedTags());
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load tags from cache immediately, refresh in background if stale
    useEffect(() => {
        const cached = getCachedTags();
        setAllTags(cached);

        // Always refresh in background to keep cache fresh
        if (isCacheStale() || cached.length === 0) {
            refreshTagCache().then(tags => {
                setAllTags(tags);
            });
        }
    }, []);

    // Filter tags based on sigil and query (instant, no API call)
    const filteredTags = allTags.filter(tag => {
        if (tag.sigil !== sigil) return false;
        if (!query) return true;
        return tag.name.toLowerCase().includes(query.toLowerCase());
    });

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [sigil, query]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const showCreateNew = query.length > 0 && !filteredTags.some(t => t.name.toLowerCase() === query.toLowerCase());
        const itemCount = filteredTags.length + (showCreateNew ? 1 : 0);

        if (itemCount === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % itemCount);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + itemCount) % itemCount);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                if (selectedIndex < filteredTags.length) {
                    onSelect(filteredTags[selectedIndex]);
                } else if (showCreateNew) {
                    onSelect({ sigil, name: query, isNew: true });
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filteredTags, selectedIndex, sigil, query, onSelect, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const showCreateNew = query.length > 0 && !filteredTags.some(t => t.name.toLowerCase() === query.toLowerCase());

    return (
        <div
            ref={containerRef}
            className="absolute z-50 w-64 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-stone-800
                       shadow-lg border border-stone-200 dark:border-stone-700 py-1"
            style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
        >
            {filteredTags.map((tag, index) => (
                <button
                    key={tag.id}
                    onClick={() => onSelect(tag)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                               hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors
                               ${index === selectedIndex ? 'bg-stone-100 dark:bg-stone-700' : ''}`}
                >
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sigilColors[tag.sigil]}`}>
                        {tag.sigil}{tag.name}
                    </span>
                </button>
            ))}

            {showCreateNew && (
                <button
                    onClick={() => onSelect({ sigil, name: query, isNew: true })}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2
                               hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors
                               ${filteredTags.length > 0 ? 'border-t border-stone-100 dark:border-stone-700' : ''}
                               ${selectedIndex === filteredTags.length ? 'bg-stone-100 dark:bg-stone-700' : ''}`}
                >
                    <span className="text-stone-500 dark:text-stone-400">Create new:</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sigilColors[sigil]}`}>
                        {sigil}{query}
                    </span>
                </button>
            )}

            {filteredTags.length === 0 && !showCreateNew && (
                <div className="px-3 py-2 text-sm text-stone-400">
                    Type to search or create a tag
                </div>
            )}
        </div>
    );
}

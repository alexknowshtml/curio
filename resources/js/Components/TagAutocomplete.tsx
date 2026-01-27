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

export function TagAutocomplete({ sigil, query, position, onSelect, onClose }: TagAutocompleteProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch matching tags
    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                const response = await axios.get('/api/tags', {
                    params: { sigil, q: query }
                });
                setTags(response.data);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Failed to fetch tags:', error);
                setTags([]);
            }
            setLoading(false);
        };

        fetchTags();
    }, [sigil, query]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const itemCount = tags.length + 1; // +1 for "Create new" option

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
                if (selectedIndex < tags.length) {
                    onSelect(tags[selectedIndex]);
                } else {
                    // Create new
                    onSelect({ sigil, name: query, isNew: true });
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [tags, selectedIndex, sigil, query, onSelect, onClose]);

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

    const showCreateNew = query.length > 0 && !tags.some(t => t.name.toLowerCase() === query.toLowerCase());

    return (
        <div
            ref={containerRef}
            className="absolute z-50 w-64 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-stone-800
                       shadow-lg border border-stone-200 dark:border-stone-700 py-1"
            style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
        >
            {loading ? (
                <div className="px-3 py-2 text-sm text-stone-400">Loading...</div>
            ) : (
                <>
                    {tags.map((tag, index) => (
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
                                       border-t border-stone-100 dark:border-stone-700
                                       ${selectedIndex === tags.length ? 'bg-stone-100 dark:bg-stone-700' : ''}`}
                        >
                            <span className="text-stone-500 dark:text-stone-400">Create new:</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sigilColors[sigil]}`}>
                                {sigil}{query}
                            </span>
                        </button>
                    )}

                    {tags.length === 0 && !showCreateNew && (
                        <div className="px-3 py-2 text-sm text-stone-400">
                            Type to search or create a tag
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

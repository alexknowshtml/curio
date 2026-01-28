import { useState, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format, parseISO, subDays, isAfter } from 'date-fns';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface SearchResult {
    id: number;
    content: string;
    created_at: string;
    tags: Tag[];
}

// Cache recent entries in memory for instant search
let cachedEntries: SearchResult[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Fetch and cache recent entries on mount
    useEffect(() => {
        const fetchRecentEntries = async () => {
            // Skip if cache is fresh
            if (Date.now() - cacheTimestamp < CACHE_TTL && cachedEntries.length > 0) {
                return;
            }

            try {
                // Fetch last 7 days of entries for local search
                const response = await axios.get('/api/search', {
                    params: { q: '', recent: true }
                });
                cachedEntries = response.data;
                cacheTimestamp = Date.now();
            } catch (error) {
                console.error('Failed to cache recent entries:', error);
            }
        };

        fetchRecentEntries();
    }, []);

    // Search local cache instantly
    const searchLocalCache = (searchQuery: string): SearchResult[] => {
        if (!searchQuery || searchQuery.length < 2) return [];

        const q = searchQuery.toLowerCase();
        return cachedEntries.filter(entry =>
            entry.content.toLowerCase().includes(q)
        ).slice(0, 10);
    };

    // Debounced server search
    const searchServer = useCallback(
        debounce(async (searchQuery: string, localResults: SearchResult[]) => {
            if (searchQuery.length < 2) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get('/api/search', {
                    params: { q: searchQuery }
                });
                const serverResults: SearchResult[] = response.data;

                // Merge results: local results first (already shown), then add any server results not in local
                const localIds = new Set(localResults.map(r => r.id));
                const newServerResults = serverResults.filter(r => !localIds.has(r.id));
                const mergedResults = [...localResults, ...newServerResults].slice(0, 20);

                setResults(mergedResults);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        }, 200),
        []
    );

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setShowResults(true);
        setSelectedIndex(-1);

        if (value.length >= 2) {
            // Instantly show local cache results
            const localResults = searchLocalCache(value);
            setResults(localResults);

            // Then fetch server results for completeness
            setIsLoading(true);
            searchServer(value, localResults);
        } else {
            setResults([]);
        }
    };

    // Navigate to entry and highlight it
    const selectEntry = (entryId: number) => {
        setShowResults(false);
        setQuery('');
        setSelectedIndex(-1);
        // Navigate to home with highlight param - clears any filters
        router.get('/home', { highlight: entryId }, {
            preserveState: false,
        });
    };

    // Handle clicking a result
    const handleResultClick = (entryId: number) => {
        selectEntry(entryId);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    selectEntry(results[selectedIndex].id);
                }
                break;
            case 'Escape':
                setShowResults(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && resultsRef.current) {
            const selectedEl = resultsRef.current.children[selectedIndex] as HTMLElement;
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Highlight matching text in content
    const highlightMatch = (content: string, searchQuery: string) => {
        if (!searchQuery) return content;

        const truncated = content.length > 100
            ? content.substring(0, 100) + '...'
            : content;

        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = truncated.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-amber-200 dark:bg-amber-700 text-inherit rounded px-0.5">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div ref={containerRef} className="relative flex-1 max-w-xs">
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setShowResults(true)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg
                             bg-stone-100 dark:bg-stone-800
                             border-0
                             text-stone-800 dark:text-stone-200
                             placeholder:text-stone-400 dark:placeholder:text-stone-500
                             focus:outline-none focus:ring-2 focus:ring-amber-500/50
                             transition-shadow"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-stone-300 dark:border-stone-600 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Results dropdown */}
            {showResults && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 max-h-80 overflow-y-auto z-50">
                    {results.length === 0 && !isLoading ? (
                        <div className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400 text-center">
                            No entries found
                        </div>
                    ) : (
                        <div ref={resultsRef} className="py-1">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleResultClick(result.id)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full text-left px-4 py-2.5 transition-colors ${
                                        index === selectedIndex
                                            ? 'bg-stone-100 dark:bg-stone-700'
                                            : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                                    }`}
                                >
                                    <div className="text-sm text-stone-800 dark:text-stone-200 line-clamp-2">
                                        {highlightMatch(result.content, query)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-stone-400 dark:text-stone-500">
                                            {format(parseISO(result.created_at), 'MMM d, yyyy')}
                                        </span>
                                        {result.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {result.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag.id}
                                                        className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400"
                                                    >
                                                        {tag.sigil}{tag.name}
                                                    </span>
                                                ))}
                                                {result.tags.length > 2 && (
                                                    <span className="text-xs text-stone-400">
                                                        +{result.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

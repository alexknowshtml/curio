import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { EntryInput } from '@/Components/EntryInput';
import { EntryBubble } from '@/Components/EntryBubble';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Image {
    id: number;
    url: string;
    filename: string;
}

interface Entry {
    id: number;
    content: string;
    created_at: string;
    tags: Tag[];
    images: Image[];
}

interface Props {
    entries: Entry[];
    allTags: Tag[];
    activeTagId: string | null;
    selectedDate: string | null;
    datesWithEntries: string[];
}

// Warm, muted tag colors that work in both modes
const sigilColors: Record<string, string> = {
    '#': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',      // topic
    '@': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', // person
};

function formatDateHeader(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
}

export default function Stream({ entries, allTags, activeTagId, selectedDate, datesWithEntries }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Optimistic entries that haven't been confirmed by server yet
    const [optimisticEntries, setOptimisticEntries] = useState<Entry[]>([]);

    // Combine server entries with optimistic ones
    const allEntries = useMemo(() => {
        // Filter out any optimistic entries that now exist in server data (by matching content + approximate time)
        const serverIds = new Set(entries.map(e => e.id));
        const pendingOptimistic = optimisticEntries.filter(opt => !serverIds.has(opt.id));
        return [...entries, ...pendingOptimistic];
    }, [entries, optimisticEntries]);

    // Callback for optimistic entry creation
    const handleOptimisticEntry = useCallback((content: string, images: { id: number; url: string; filename: string }[]) => {
        const optimisticEntry: Entry = {
            id: -Date.now(), // Negative ID to avoid conflicts
            content,
            created_at: new Date().toISOString(),
            tags: [], // Tags will be populated when server responds
            images,
        };
        setOptimisticEntries(prev => [...prev, optimisticEntry]);

        // Scroll to bottom after adding
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, []);

    // Clear optimistic entries when server data updates (entries prop changes)
    useLayoutEffect(() => {
        if (optimisticEntries.length > 0) {
            // Give a small delay to let the real entry render, then clear optimistic
            const timeout = setTimeout(() => {
                setOptimisticEntries([]);
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [entries]);

    // Group entries by date and sort oldest first within each day
    const entriesByDate = useMemo(() => {
        const groups: Record<string, Entry[]> = {};
        for (const entry of allEntries) {
            const dateKey = format(parseISO(entry.created_at), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        }
        // Sort entries within each day by created_at ascending (oldest first)
        for (const dateKey of Object.keys(groups)) {
            groups[dateKey].sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        }
        return groups;
    }, [allEntries]);

    // Sort dates oldest first so newest day is at the bottom
    const sortedDates = useMemo(() => {
        return Object.keys(entriesByDate).sort((a, b) => a.localeCompare(b));
    }, [entriesByDate]);

    // Scroll to bottom on initial load and when entries change
    useLayoutEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'instant' });
        }
    }, [entries.length]);

    const handleTagClick = (tagId: number | null) => {
        const params: Record<string, string> = {};
        if (tagId !== null) params.tag = String(tagId);
        if (selectedDate) params.date = selectedDate;
        router.get('/stream', params, { preserveState: true });
    };

    const handleDateClick = (date: string | null) => {
        const params: Record<string, string> = {};
        if (activeTagId) params.tag = activeTagId;
        if (date !== null) params.date = date;
        router.get('/stream', params, { preserveState: true });
    };

    const clearFilters = () => {
        router.get('/stream', {}, { preserveState: true });
    };

    const hasFilters = activeTagId || selectedDate;

    return (
        <AuthenticatedLayout>
            <Head title="Stream" />

            <div className="flex flex-col h-full">
                {/* Filter bar */}
                <div className="flex-shrink-0 border-b border-stone-200/50 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/30 px-4 py-3">
                    <div className="max-w-3xl mx-auto space-y-3">
                        {/* Date chips */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
                            <button
                                onClick={() => handleDateClick(null)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                    ${!selectedDate
                                        ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900'
                                        : 'bg-stone-200/70 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-600/50'
                                    }`}
                            >
                                All
                            </button>
                            {datesWithEntries.slice(0, 7).map((date) => (
                                <button
                                    key={date}
                                    onClick={() => handleDateClick(date)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${selectedDate === date
                                            ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900'
                                            : 'bg-stone-200/70 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-600/50'
                                        }`}
                                >
                                    {formatDateHeader(date)}
                                </button>
                            ))}
                        </div>

                        {/* Tag chips */}
                        {allTags && allTags.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
                                <button
                                    onClick={() => handleTagClick(null)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${!activeTagId
                                            ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900'
                                            : 'bg-stone-200/70 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-600/50'
                                        }`}
                                >
                                    All tags
                                </button>
                                {allTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagClick(tag.id)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                            ${activeTagId && parseInt(activeTagId) === tag.id
                                                ? 'ring-2 ring-stone-400 dark:ring-stone-500 ' + sigilColors[tag.sigil]
                                                : sigilColors[tag.sigil]
                                            }`}
                                    >
                                        {tag.sigil}{tag.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Entry stream - oldest at top, newest at bottom */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
                    <div className="max-w-3xl mx-auto">
                        {entries.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
                                    <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-stone-600 dark:text-stone-400">Your cabinet is empty</p>
                                <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">Start collecting your curiosities below</p>
                            </div>
                        ) : (
                            sortedDates.map((dateKey) => (
                                <div key={dateKey} className="mb-8">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 sticky top-0 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm py-2 -mx-2 px-2">
                                        {formatDateHeader(dateKey)}
                                    </h3>
                                    <div className="space-y-3">
                                        {entriesByDate[dateKey].map((entry) => (
                                            <EntryBubble key={entry.id} entry={entry} onTagClick={handleTagClick} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                        {/* Scroll anchor at the bottom */}
                        <div ref={bottomRef} />
                    </div>
                </div>

                {/* Input area */}
                <div data-input-bar className="flex-shrink-0 border-t border-stone-200/50 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-4 py-3 pb-safe">
                    <div className="max-w-3xl mx-auto">
                        <EntryInput onOptimisticSubmit={handleOptimisticEntry} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { EntryInput } from '@/Components/EntryInput';
import { EntryBubble } from '@/Components/EntryBubble';
import { TagFilterDropdown } from '@/Components/TagFilterDropdown';
import { DatePicker } from '@/Components/DatePicker';
import { FilterMismatchModal } from '@/Components/FilterMismatchModal';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useMemo, useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Attachment {
    id: number;
    type: 'image' | 'document' | 'text' | 'other';
    url: string;
    filename: string;
    original_filename: string;
    mime_type: string;
    size: number;
    human_size: string;
}

interface Entry {
    id: number;
    content: string;
    created_at: string;
    tags: Tag[];
    attachments: Attachment[];
}

interface Props {
    entries: Entry[];
    allTags: Tag[];
    activeTagId: string | null;
    selectedDate: string | null;
    datesWithEntries: string[];
    highlightEntryId: number | null;
}

function formatDateHeader(dateStr: string): { label: string; date: string } {
    const date = parseISO(dateStr);
    const dateFormatted = format(date, 'MMMM d');
    if (isToday(date)) return { label: 'Today', date: dateFormatted };
    if (isYesterday(date)) return { label: 'Yesterday', date: dateFormatted };
    return { label: format(date, 'EEEE'), date: dateFormatted };
}

export default function Stream({ entries, allTags, activeTagId, selectedDate, datesWithEntries, highlightEntryId }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const allButtonRef = useRef<HTMLButtonElement>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showFilterMismatchModal, setShowFilterMismatchModal] = useState(false);
    const [highlightedId, setHighlightedId] = useState<number | null>(highlightEntryId);

    // Track if we have an active filter (tag or date that's not today)
    const hasActiveFilter = !!activeTagId || (!!selectedDate && !isToday(parseISO(selectedDate)));

    // Handle highlight from search - scroll to entry and keep highlighted until user clicks
    useEffect(() => {
        if (highlightEntryId) {
            // Wait for Inertia page transition to complete (setTimeout more reliable than RAF for this)
            const timeoutId = setTimeout(() => {
                const entryEl = document.querySelector(`[data-entry-id="${highlightEntryId}"]`) as HTMLElement;
                const scrollContainer = scrollRef.current;

                if (entryEl && scrollContainer) {
                    const entryRect = entryEl.getBoundingClientRect();
                    const containerRect = scrollContainer.getBoundingClientRect();

                    // Check if entry is already fully visible in container
                    const isFullyVisible = entryRect.top >= containerRect.top &&
                                           entryRect.bottom <= containerRect.bottom;

                    if (!isFullyVisible) {
                        // Position the entry's TOP about 40% down the container
                        // This keeps it visible regardless of entry height
                        const targetPositionInContainer = containerRect.height * 0.4;
                        const currentEntryTop = entryRect.top - containerRect.top;
                        const scrollAdjustment = currentEntryTop - targetPositionInContainer;

                        scrollContainer.scrollBy({
                            top: scrollAdjustment,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 300);

            // Clear highlight when user clicks anywhere on the page
            const handleClick = () => {
                setHighlightedId(null);
            };
            setTimeout(() => {
                document.addEventListener('click', handleClick, { once: true });
            }, 500);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('click', handleClick);
            };
        }
    }, [highlightEntryId]);

    // Optimistic entries that haven't been confirmed by server yet
    const [optimisticEntries, setOptimisticEntries] = useState<Entry[]>([]);

    // Combine server entries with optimistic ones
    const allEntries = useMemo(() => {
        // Filter out optimistic entries that likely now exist in server data
        // Match by content similarity since optimistic IDs are negative
        const pendingOptimistic = optimisticEntries.filter(opt => {
            // Check if any server entry has matching content (added within last 30 seconds)
            const optTime = new Date(opt.created_at).getTime();
            return !entries.some(e => {
                const serverTime = new Date(e.created_at).getTime();
                const timeDiff = Math.abs(serverTime - optTime);
                // Match if content is same and within 30 seconds
                return e.content === opt.content && timeDiff < 30000;
            });
        });
        return [...entries, ...pendingOptimistic];
    }, [entries, optimisticEntries]);

    // Callback for optimistic entry creation
    const handleOptimisticEntry = useCallback((content: string, attachments: Attachment[]) => {
        const optimisticEntry: Entry = {
            id: -Date.now(), // Negative ID to avoid conflicts
            content,
            created_at: new Date().toISOString(),
            tags: [], // Tags will be populated when server responds
            attachments,
        };
        setOptimisticEntries(prev => [...prev, optimisticEntry]);

        // Scroll to bottom after adding
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);

        // If there's an active filter, show the mismatch modal after a delay
        // (giving time for the server to respond and confirm it's not in the filtered results)
        if (hasActiveFilter) {
            setTimeout(() => {
                // Check if the entry appeared in the server results
                // If not, show the modal
                setOptimisticEntries(prev => {
                    const stillPending = prev.some(e => e.id === optimisticEntry.id);
                    if (stillPending) {
                        setShowFilterMismatchModal(true);
                    }
                    return prev.filter(e => e.id !== optimisticEntry.id);
                });
            }, 1500); // Wait 1.5s for server response
        } else {
            // No filter active - just clean up after 5 seconds as safety
            setTimeout(() => {
                setOptimisticEntries(prev => prev.filter(e => e.id !== optimisticEntry.id));
            }, 5000);
        }
    }, [hasActiveFilter]);

    // Clear optimistic entries when server data updates (entries prop changes)
    useLayoutEffect(() => {
        if (optimisticEntries.length > 0 && entries.length > 0) {
            // Clear any optimistic entries that have been confirmed by server
            // This happens immediately now since deduplication handles the visual
            setOptimisticEntries(prev => prev.filter(opt => {
                const optTime = new Date(opt.created_at).getTime();
                return !entries.some(e => {
                    const serverTime = new Date(e.created_at).getTime();
                    return e.content === opt.content && Math.abs(serverTime - optTime) < 30000;
                });
            }));
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
    // Skip if we have a highlighted entry (search result navigation)
    useLayoutEffect(() => {
        if (highlightEntryId) return; // Don't auto-scroll when navigating to highlighted entry
        if (bottomRef.current) {
            // Immediate scroll
            bottomRef.current.scrollIntoView({ behavior: 'instant' });
            // Also scroll after a brief delay to catch any late-loading content
            const timeout = setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'instant' });
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [entries, highlightEntryId]); // Trigger on entries reference change, not just length

    // Additional scroll on mount to handle any late-rendering content (images, etc.)
    // Skip if we have a highlighted entry (search result navigation)
    useEffect(() => {
        if (highlightEntryId) return; // Don't auto-scroll when navigating to highlighted entry
        const scrollToBottom = () => {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        };
        // Multiple attempts to catch various loading states
        scrollToBottom();
        const t1 = setTimeout(scrollToBottom, 200);
        const t2 = setTimeout(scrollToBottom, 500);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [highlightEntryId]); // Only on mount, skip if highlight present

    const handleTagClick = (tagId: number | null) => {
        const params: Record<string, string> = {};
        if (tagId !== null) params.tag = String(tagId);
        if (selectedDate) params.date = selectedDate;
        setIsFiltering(true);
        router.get('/home', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['entries', 'activeTagId', 'selectedDate'],
            onFinish: () => setIsFiltering(false),
        });
    };

    const handleDateClick = (date: string | null) => {
        const params: Record<string, string> = {};
        if (activeTagId) params.tag = activeTagId;
        if (date !== null) params.date = date;
        setIsFiltering(true);
        router.get('/home', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['entries', 'activeTagId', 'selectedDate'],
            onFinish: () => setIsFiltering(false),
        });
    };

    const clearFilters = () => {
        setIsFiltering(true);
        router.get('/home', {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['entries', 'activeTagId', 'selectedDate'],
            onFinish: () => setIsFiltering(false),
        });
    };

    // Handle "View Entry" from filter mismatch modal - clear all filters
    const handleViewEntry = () => {
        setShowFilterMismatchModal(false);
        clearFilters();
    };

    // Handle "Stay Here" from filter mismatch modal - just close modal
    const handleStayHere = () => {
        setShowFilterMismatchModal(false);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Home" />

            <div className="flex flex-col h-full">
                {/* Filter bar */}
                <div className="flex-shrink-0 border-b border-stone-200/50 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/30 px-4 py-2.5 relative z-20">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                        {/* Date chips - left side */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 relative">
                            {/* Calendar icon button */}
                            <button
                                ref={allButtonRef}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex-shrink-0 p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-700/50 transition-all"
                                aria-label="Jump to date"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <DatePicker
                                isOpen={showDatePicker}
                                onClose={() => setShowDatePicker(false)}
                                onSelectDate={(date) => {
                                    handleDateClick(date);
                                    setShowDatePicker(false);
                                }}
                                datesWithEntries={datesWithEntries}
                                selectedDate={selectedDate}
                                triggerRef={allButtonRef}
                            />
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
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
                                    {formatDateHeader(date).label}
                                </button>
                            ))}
                            </div>
                        </div>

                        {/* Tag dropdown - right side */}
                        <TagFilterDropdown
                            allTags={allTags}
                            activeTagId={activeTagId}
                            onTagClick={handleTagClick}
                        />
                    </div>
                </div>

                {/* Entry stream - oldest at top, newest at bottom */}
                <div ref={scrollRef} className={`flex-1 overflow-y-auto scrollbar-thin px-4 pb-2 transition-opacity duration-150 ${isFiltering ? 'opacity-50' : ''}`}>
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
                            sortedDates.map((dateKey, idx) => (
                                <div key={dateKey} className={`relative ${idx < sortedDates.length - 1 ? 'mb-6' : 'mb-2'}`}>
                                    <div className="sticky top-0 z-10 -mx-4 px-4 py-2
                                                   bg-stone-100/95 dark:bg-stone-900/95 backdrop-blur-sm
                                                   border-b border-stone-200/50 dark:border-stone-700/50">
                                        <div className="flex items-baseline justify-end gap-2">
                                            <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                                                {formatDateHeader(dateKey).label}
                                            </span>
                                            <span className="text-xs text-stone-400 dark:text-stone-500">
                                                {formatDateHeader(dateKey).date}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-stone-200/60 dark:divide-stone-700/50">
                                        {entriesByDate[dateKey].map((entry) => (
                                            <div
                                                key={entry.id}
                                                data-entry-id={entry.id}
                                                className={`py-3 first:pt-4 transition-colors duration-500 ${
                                                    highlightedId === entry.id
                                                        ? 'bg-amber-100/50 dark:bg-amber-900/30 -mx-4 px-4 rounded-lg'
                                                        : ''
                                                }`}
                                            >
                                                <EntryBubble entry={entry} onTagClick={handleTagClick} />
                                            </div>
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

            {/* Filter mismatch modal */}
            <FilterMismatchModal
                show={showFilterMismatchModal}
                onViewEntry={handleViewEntry}
                onStayHere={handleStayHere}
            />
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { EntryInput } from '@/Components/EntryInput';
import { EntryBubble } from '@/Components/EntryBubble';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useMemo } from 'react';

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

// Color classes for each sigil type (matching EntryBubble)
const sigilColors: Record<string, string> = {
    '#': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    '@': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '$': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    '!': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '~': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

function formatDateHeader(dateStr: string): string {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
}

export default function Stream({ entries, allTags, activeTagId, selectedDate, datesWithEntries }: Props) {
    // Group entries by date
    const entriesByDate = useMemo(() => {
        const groups: Record<string, Entry[]> = {};
        for (const entry of entries) {
            const dateKey = format(parseISO(entry.created_at), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(entry);
        }
        return groups;
    }, [entries]);

    const sortedDates = useMemo(() => {
        return Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));
    }, [entriesByDate]);

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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Stream
                </h2>
            }
        >
            <Head title="Stream" />

            <div className="flex flex-col h-[calc(100vh-8rem)] pt-[env(safe-area-inset-top)]">
                {/* Filter bar: tags and date picker */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                    <div className="mx-auto max-w-3xl">
                        {/* Date picker row */}
                        <div className="flex items-center gap-3 mb-3">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Date:</label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => handleDateClick(null)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                               ${!selectedDate
                                                   ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                                                   : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                               }`}
                                >
                                    All time
                                </button>
                                {datesWithEntries.slice(0, 7).map((date) => (
                                    <button
                                        key={date}
                                        onClick={() => handleDateClick(date)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                                   ${selectedDate === date
                                                       ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                                                       : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                   }`}
                                    >
                                        {formatDateHeader(date)}
                                    </button>
                                ))}
                                {datesWithEntries.length > 7 && (
                                    <input
                                        type="date"
                                        value={selectedDate || ''}
                                        onChange={(e) => handleDateClick(e.target.value || null)}
                                        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600
                                                   bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Tag filter row */}
                        {allTags && allTags.length > 0 && (
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tags:</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleTagClick(null)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                                   ${!activeTagId
                                                       ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                                                       : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                   }`}
                                    >
                                        All
                                    </button>
                                    {allTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleTagClick(tag.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                                       ${activeTagId && parseInt(activeTagId) === tag.id
                                                           ? 'ring-2 ring-offset-1 ring-gray-800 dark:ring-white ' + sigilColors[tag.sigil]
                                                           : sigilColors[tag.sigil] + ' hover:opacity-80'
                                                       }`}
                                        >
                                            {tag.sigil}{tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Clear filters button */}
                        {hasFilters && (
                            <div className="mt-2">
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Entry stream - scrollable, grouped by date */}
                <div className="flex-1 overflow-y-auto px-4 py-6 pb-[env(safe-area-inset-bottom)]">
                    <div className="mx-auto max-w-3xl">
                        {entries.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p className="text-lg">No entries yet.</p>
                                <p className="text-sm mt-2">Start capturing your thoughts below.</p>
                            </div>
                        ) : (
                            sortedDates.map((dateKey) => (
                                <div key={dateKey} className="mb-8">
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-gray-100 dark:bg-gray-900 py-2 px-2 -mx-2 rounded">
                                        {formatDateHeader(dateKey)}
                                    </h3>
                                    <div className="space-y-4">
                                        {entriesByDate[dateKey].map((entry) => (
                                            <EntryBubble key={entry.id} entry={entry} onTagClick={handleTagClick} />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Entry input - fixed at bottom */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-[env(safe-area-inset-bottom)]">
                    <div className="mx-auto max-w-3xl px-4 py-4">
                        <EntryInput />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

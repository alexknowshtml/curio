import { useState, useRef, useEffect, useMemo } from 'react';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Props {
    allTags: Tag[];
    activeTagId: string | null;
    selectedDate: string | null;
    datesWithEntries: string[];
    onTagClick: (tagId: number | null) => void;
    onDateClick: (date: string | null) => void;
    onClearFilters: () => void;
    formatDateHeader: (dateStr: string) => string;
}

// Muted, warm tag colors
const sigilColors: Record<string, string> = {
    '#': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    '@': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function FilterDropdown({
    allTags,
    activeTagId,
    selectedDate,
    datesWithEntries,
    onTagClick,
    onDateClick,
    onClearFilters,
    formatDateHeader,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasFilters = activeTagId || selectedDate;

    // Get active filter label for button display
    const activeFilterLabel = useMemo(() => {
        if (activeTagId) {
            const tag = allTags.find(t => t.id === parseInt(activeTagId));
            return tag ? `${tag.sigil}${tag.name}` : 'Filter';
        }
        if (selectedDate) {
            return formatDateHeader(selectedDate);
        }
        return 'Filter';
    }, [activeTagId, selectedDate, allTags, formatDateHeader]);

    // Filter tags and dates based on search
    const filteredTags = useMemo(() => {
        if (!searchQuery) return allTags;
        const q = searchQuery.toLowerCase();
        return allTags.filter(tag => tag.name.toLowerCase().includes(q));
    }, [allTags, searchQuery]);

    const filteredDates = useMemo(() => {
        if (!searchQuery) return datesWithEntries.slice(0, 14);
        const q = searchQuery.toLowerCase();
        return datesWithEntries.filter(date =>
            formatDateHeader(date).toLowerCase().includes(q)
        ).slice(0, 14);
    }, [datesWithEntries, searchQuery, formatDateHeader]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (type: 'tag' | 'date', value: number | string | null) => {
        if (type === 'tag') {
            onTagClick(value as number | null);
        } else {
            onDateClick(value as string | null);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${hasFilters
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-stone-200/70 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-600/50'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {activeFilterLabel}
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {hasFilters && (
                    <button
                        onClick={onClearFilters}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/70
                                   dark:hover:text-stone-300 dark:hover:bg-stone-700/50 transition-colors"
                        title="Clear filters"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 z-30 w-72
                                bg-white dark:bg-stone-800 rounded-xl shadow-xl
                                border border-stone-200 dark:border-stone-700
                                overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-stone-200 dark:border-stone-700">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tags or dates..."
                            className="w-full px-3 py-2 text-sm rounded-lg
                                       bg-stone-100 dark:bg-stone-900
                                       text-stone-800 dark:text-stone-200
                                       placeholder-stone-400 dark:placeholder-stone-500
                                       border-0 focus:ring-2 focus:ring-amber-500/50
                                       outline-none"
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {/* Clear option */}
                        {hasFilters && (
                            <button
                                onClick={() => {
                                    onClearFilters();
                                    setIsOpen(false);
                                    setSearchQuery('');
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm
                                           text-amber-600 dark:text-amber-400
                                           hover:bg-stone-100 dark:hover:bg-stone-700/50
                                           transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear all filters
                            </button>
                        )}

                        {/* Tags section */}
                        {filteredTags.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                                    Tags
                                </div>
                                {filteredTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleSelect('tag', tag.id)}
                                        className={`w-full px-4 py-2.5 text-left text-sm
                                                   hover:bg-stone-100 dark:hover:bg-stone-700/50
                                                   transition-colors flex items-center justify-between
                                                   ${activeTagId && parseInt(activeTagId) === tag.id ? 'bg-stone-100 dark:bg-stone-700/50' : ''}`}
                                    >
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sigilColors[tag.sigil]}`}>
                                            {tag.sigil}{tag.name}
                                        </span>
                                        {activeTagId && parseInt(activeTagId) === tag.id && (
                                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Dates section */}
                        {filteredDates.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider border-t border-stone-200 dark:border-stone-700 mt-1">
                                    Dates
                                </div>
                                {filteredDates.map((date) => (
                                    <button
                                        key={date}
                                        onClick={() => handleSelect('date', date)}
                                        className={`w-full px-4 py-2.5 text-left text-sm
                                                   text-stone-700 dark:text-stone-300
                                                   hover:bg-stone-100 dark:hover:bg-stone-700/50
                                                   transition-colors flex items-center justify-between
                                                   ${selectedDate === date ? 'bg-stone-100 dark:bg-stone-700/50' : ''}`}
                                    >
                                        <span>{formatDateHeader(date)}</span>
                                        {selectedDate === date && (
                                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {filteredTags.length === 0 && filteredDates.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

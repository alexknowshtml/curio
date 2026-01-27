import { useState, useRef, useEffect, useMemo } from 'react';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Props {
    allTags: Tag[];
    activeTagId: string | null;
    onTagClick: (tagId: number | null) => void;
}

// Muted, warm tag colors
const sigilColors: Record<string, string> = {
    '#': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    '@': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export function TagFilterDropdown({ allTags, activeTagId, onTagClick }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasFilter = !!activeTagId;

    // Get active filter label for button display
    const activeFilterLabel = useMemo(() => {
        if (activeTagId) {
            const tag = allTags.find(t => t.id === parseInt(activeTagId));
            return tag ? `${tag.sigil}${tag.name}` : 'Tags';
        }
        return 'Tags';
    }, [activeTagId, allTags]);

    // Filter tags based on search
    const filteredTags = useMemo(() => {
        if (!searchQuery) return allTags;
        const q = searchQuery.toLowerCase();
        return allTags.filter(tag => tag.name.toLowerCase().includes(q));
    }, [allTags, searchQuery]);

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

    const handleSelect = (tagId: number | null) => {
        onTagClick(tagId);
        setIsOpen(false);
        setSearchQuery('');
    };

    if (allTags.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${hasFilter
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-stone-200/70 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-600/50'
                    }`}
            >
                {activeFilterLabel}
                <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-30 w-64
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
                            placeholder="Search tags..."
                            className="w-full px-3 py-2 text-sm rounded-lg
                                       bg-stone-100 dark:bg-stone-900
                                       text-stone-800 dark:text-stone-200
                                       placeholder-stone-400 dark:placeholder-stone-500
                                       border-0 focus:ring-2 focus:ring-amber-500/50
                                       outline-none"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {/* All tags option */}
                        <button
                            onClick={() => handleSelect(null)}
                            className={`w-full px-4 py-2.5 text-left text-sm
                                       hover:bg-stone-100 dark:hover:bg-stone-700/50
                                       transition-colors flex items-center justify-between
                                       ${!activeTagId ? 'bg-stone-100 dark:bg-stone-700/50' : ''}`}
                        >
                            <span className="text-stone-700 dark:text-stone-300">All tags</span>
                            {!activeTagId && (
                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>

                        {/* Tags */}
                        {filteredTags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => handleSelect(tag.id)}
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

                        {/* Empty state */}
                        {filteredTags.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
                                No tags found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

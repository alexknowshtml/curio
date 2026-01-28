import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    datesWithEntries: string[];
    selectedDate: string | null;
    triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function DatePicker({ isOpen, onClose, onSelectDate, datesWithEntries, selectedDate, triggerRef }: DatePickerProps) {
    const [viewDate, setViewDate] = useState(() => {
        if (selectedDate) return parseISO(selectedDate);
        if (datesWithEntries.length > 0) return parseISO(datesWithEntries[0]);
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert datesWithEntries to a Set for fast lookup
    const entryDatesSet = new Set(datesWithEntries);

    // Close on click outside (but not on the trigger button)
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            // Don't close if clicking the trigger button (it handles its own toggle)
            if (triggerRef?.current?.contains(target)) return;
            if (containerRef.current && !containerRef.current.contains(target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen, onClose, triggerRef]);

    // Close on escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start of month to align with weekday
    const startDayOfWeek = monthStart.getDay();
    const paddedDays = [...Array(startDayOfWeek).fill(null), ...days];

    const handleDayClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        if (entryDatesSet.has(dateStr)) {
            onSelectDate(dateStr);
            onClose();
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-3 min-w-[280px]"
        >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => setViewDate(subMonths(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {format(viewDate, 'MMMM yyyy')}
                </span>
                <button
                    onClick={() => setViewDate(addMonths(viewDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-stone-400 dark:text-stone-500 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
                {paddedDays.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} className="w-8 h-8" />;
                    }

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const hasEntries = entryDatesSet.has(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <button
                            key={dateStr}
                            onClick={() => handleDayClick(day)}
                            disabled={!hasEntries}
                            className={`
                                w-8 h-8 rounded-lg text-sm font-medium transition-all
                                flex items-center justify-center relative
                                ${!isCurrentMonth ? 'text-stone-300 dark:text-stone-600' : ''}
                                ${hasEntries && !isSelected
                                    ? 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer'
                                    : ''
                                }
                                ${!hasEntries
                                    ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
                                    : ''
                                }
                                ${isSelected
                                    ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900'
                                    : ''
                                }
                                ${isToday && !isSelected
                                    ? 'ring-1 ring-amber-500'
                                    : ''
                                }
                            `}
                        >
                            {format(day, 'd')}
                            {hasEntries && !isSelected && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react';
import { router } from '@inertiajs/react';

export function EntryInput() {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea as content grows
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, [content]);

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);

        router.post('/entries', { content }, {
            preserveScroll: true,
            onSuccess: () => {
                setContent('');
                setIsSubmitting(false);
                textareaRef.current?.focus();
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What's on your mind?"
                    disabled={isSubmitting}
                    className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-900 px-4 py-3
                               text-gray-900 dark:text-gray-100
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-150"
                    rows={1}
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Press Enter to save, Shift+Enter for new line
                </p>
            </div>
            <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700
                           text-white font-medium rounded-lg
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           dark:focus:ring-offset-gray-800
                           transition-colors duration-150"
            >
                {isSubmitting ? 'Saving...' : 'Save'}
            </button>
        </form>
    );
}

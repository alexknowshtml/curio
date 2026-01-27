import { router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';

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
    entry: Entry;
    onTagClick?: (tagId: number) => void;
}

// Muted, warm color classes for each sigil type
const sigilColors: Record<string, string> = {
    '#': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',           // topic
    '@': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', // person
};

export function EntryBubble({ entry, onTagClick }: Props) {
    const createdAt = parseISO(entry.created_at);
    const timeStr = format(createdAt, 'h:mm a');
    const dateStr = format(createdAt, 'MMM d');

    // Optimistic entries have negative IDs
    const isOptimistic = entry.id < 0;

    const handleDelete = () => {
        if (confirm('Delete this entry?')) {
            router.delete(`/entries/${entry.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className={`group relative ${isOptimistic ? 'opacity-70' : ''}`}>
            {/* Images */}
            {entry.images && entry.images.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {entry.images.map((image) => (
                        <a
                            key={image.id}
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <img
                                src={image.url}
                                alt={image.filename}
                                className="rounded-xl max-h-48 object-cover hover:opacity-90 transition-opacity"
                            />
                        </a>
                    ))}
                </div>
            )}

            {/* Content with markdown rendering */}
            <div className="prose-curio text-stone-800 dark:text-stone-200 text-base leading-relaxed">
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="my-1">{children}</p>,
                        a: ({ href, children }) => (
                            <a href={href} className="text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-300">
                                {children}
                            </a>
                        ),
                        code: ({ children }) => (
                            <code className="text-sm bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                {children}
                            </code>
                        ),
                    }}
                >
                    {entry.content}
                </ReactMarkdown>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => onTagClick?.(tag.id)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                       hover:scale-105 transition-transform
                                       ${sigilColors[tag.sigil] || sigilColors['#']}`}
                        >
                            {tag.sigil}{tag.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Footer: timestamp and actions */}
            <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-stone-400 dark:text-stone-500">
                    {isOptimistic ? 'Saving...' : `${timeStr} · ${dateStr}`}
                </span>

                {/* Delete button - shows on hover (not for optimistic entries) */}
                {!isOptimistic && (
                    <button
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 text-xs text-stone-400 hover:text-rose-500
                                   dark:text-stone-500 dark:hover:text-rose-400
                                   transition-all duration-150"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}

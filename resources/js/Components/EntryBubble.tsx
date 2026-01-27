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

// Color classes for each sigil type
const sigilColors: Record<string, string> = {
    '#': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',      // topic
    '@': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',  // person
    '$': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', // product
    '!': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',          // priority
    '~': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',  // project
};

export function EntryBubble({ entry, onTagClick }: Props) {
    const createdAt = parseISO(entry.created_at);
    const timeStr = format(createdAt, 'h:mm a');
    const dateStr = format(createdAt, 'MMM d');

    const handleDelete = () => {
        if (confirm('Delete this entry?')) {
            router.delete(`/entries/${entry.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
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
                                className="rounded-lg max-h-48 object-cover hover:opacity-90 transition-opacity"
                            />
                        </a>
                    ))}
                </div>
            )}

            {/* Content with markdown rendering */}
            <div className="text-gray-900 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none
                           prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
                           prose-a:text-blue-600 dark:prose-a:text-blue-400">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => onTagClick?.(tag.id)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                       cursor-pointer hover:opacity-80 transition-opacity
                                       ${sigilColors[tag.sigil] || sigilColors['#']}`}
                        >
                            {tag.sigil}{tag.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Footer: timestamp and actions */}
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {timeStr} · {dateStr}
                </span>

                {/* Delete button - shows on hover */}
                <button
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700
                               dark:text-red-400 dark:hover:text-red-300
                               transition-opacity duration-150"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

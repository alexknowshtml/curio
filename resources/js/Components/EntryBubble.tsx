import { router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';

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
    attachments?: Attachment[];
    images?: Attachment[]; // backwards compatible
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

// Get file icon based on type
function getFileIcon(type: string, mimeType: string): string {
    if (type === 'image') return '🖼️';
    if (type === 'document') return '📄';
    if (mimeType.includes('json')) return '{ }';
    if (mimeType.includes('markdown') || mimeType.includes('text/plain')) return '📝';
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) return '📜';
    if (mimeType.includes('python')) return '🐍';
    if (mimeType.includes('html') || mimeType.includes('css')) return '🌐';
    return '📎';
}

// Get friendly file type label
function getFileTypeLabel(mimeType: string): string {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'text/plain') return 'Text';
    if (mimeType.includes('markdown')) return 'Markdown';
    if (mimeType.includes('json')) return 'JSON';
    if (mimeType.includes('csv')) return 'CSV';
    if (mimeType.includes('html')) return 'HTML';
    if (mimeType.includes('css')) return 'CSS';
    if (mimeType.includes('javascript')) return 'JavaScript';
    if (mimeType.includes('python')) return 'Python';
    return 'File';
}

export function EntryBubble({ entry, onTagClick }: Props) {
    const createdAt = parseISO(entry.created_at);
    const timeStr = format(createdAt, 'h:mm a');

    // Optimistic entries have negative IDs
    const isOptimistic = entry.id < 0;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Use attachments if available, fall back to images for backwards compatibility
    const attachments = entry.attachments || entry.images || [];
    const images = attachments.filter(a => a.type === 'image');
    const documents = attachments.filter(a => a.type === 'document');
    const textFiles = attachments.filter(a => a.type === 'text');
    const otherFiles = attachments.filter(a => a.type === 'other');

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleDelete = () => {
        setMenuOpen(false);
        if (confirm('Delete this entry?')) {
            router.delete(`/entries/${entry.id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleCopy = async () => {
        setMenuOpen(false);
        try {
            await navigator.clipboard.writeText(entry.content);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = entry.content;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    };

    return (
        <div className={`relative flex items-start gap-4 ${isOptimistic ? 'opacity-70' : ''}`}>
            {/* Main content area */}
            <div className="flex-1 min-w-0">
                {/* Images - display as thumbnails */}
                {images.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {images.map((image) => (
                            <a
                                key={image.id}
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <img
                                    src={image.url}
                                    alt={image.original_filename || image.filename}
                                    className="rounded-xl max-h-48 object-cover hover:opacity-90 transition-opacity"
                                />
                            </a>
                        ))}
                    </div>
                )}

                {/* PDFs - display as clickable cards */}
                {documents.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {documents.map((doc) => (
                            <a
                                key={doc.id}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg
                                           bg-rose-50 dark:bg-rose-900/30
                                           border border-rose-200 dark:border-rose-800
                                           hover:bg-rose-100 dark:hover:bg-rose-900/50
                                           transition-colors group"
                            >
                                <span className="text-xl">📄</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-rose-700 dark:text-rose-300 group-hover:underline truncate max-w-[200px]">
                                        {doc.original_filename || doc.filename}
                                    </span>
                                    <span className="text-xs text-rose-500 dark:text-rose-400">
                                        PDF · {doc.human_size}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Text files - display as clickable cards with preview potential */}
                {textFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {textFiles.map((file) => (
                            <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg
                                           bg-amber-50 dark:bg-amber-900/30
                                           border border-amber-200 dark:border-amber-800
                                           hover:bg-amber-100 dark:hover:bg-amber-900/50
                                           transition-colors group"
                            >
                                <span className="text-xl">{getFileIcon('text', file.mime_type)}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300 group-hover:underline truncate max-w-[200px]">
                                        {file.original_filename || file.filename}
                                    </span>
                                    <span className="text-xs text-amber-500 dark:text-amber-400">
                                        {getFileTypeLabel(file.mime_type)} · {file.human_size}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Other files - generic download links */}
                {otherFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {otherFiles.map((file) => (
                            <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg
                                           bg-stone-100 dark:bg-stone-800
                                           border border-stone-200 dark:border-stone-700
                                           hover:bg-stone-200 dark:hover:bg-stone-700
                                           transition-colors group"
                            >
                                <span className="text-xl">📎</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300 group-hover:underline truncate max-w-[200px]">
                                        {file.original_filename || file.filename}
                                    </span>
                                    <span className="text-xs text-stone-500 dark:text-stone-400">
                                        {file.human_size}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Content with markdown rendering */}
                <div className="prose-curio text-stone-800 dark:text-stone-200 text-base leading-relaxed [&>p:first-child]:mt-0">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="my-1 first:mt-0">{children}</p>,
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
            </div>

            {/* Timestamp and tags - right side */}
            <div className="relative flex-shrink-0 mt-1 flex flex-col items-end" ref={menuRef}>
                <button
                    onClick={() => !isOptimistic && setMenuOpen(!menuOpen)}
                    disabled={isOptimistic}
                    className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap text-right
                               hover:text-stone-600 dark:hover:text-stone-400 transition-colors"
                >
                    {isOptimistic ? 'Saving...' : timeStr}
                </button>

                {/* Tags - under timestamp */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 justify-end max-w-[100px]">
                        {entry.tags.map((tag) => (
                            <button
                                key={tag.id}
                                onClick={() => onTagClick?.(tag.id)}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium
                                           hover:scale-105 transition-transform
                                           ${sigilColors[tag.sigil] || sigilColors['#']}`}
                            >
                                {tag.sigil}{tag.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Dropdown menu */}
                {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20
                                    bg-white dark:bg-stone-800 rounded-lg shadow-lg
                                    border border-stone-200 dark:border-stone-700
                                    py-1 min-w-[120px]">
                        <button
                            onClick={handleCopy}
                            className="w-full px-3 py-2 text-left text-sm
                                       text-stone-700 dark:text-stone-300
                                       hover:bg-stone-100 dark:hover:bg-stone-700
                                       transition-colors"
                        >
                            Copy
                        </button>
                        <button
                            onClick={handleDelete}
                            className="w-full px-3 py-2 text-left text-sm
                                       text-rose-600 dark:text-rose-400
                                       hover:bg-rose-50 dark:hover:bg-rose-900/30
                                       transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

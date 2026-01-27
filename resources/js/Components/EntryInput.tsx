import { useState, useRef, useEffect, KeyboardEvent, FormEvent, ClipboardEvent, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { TagAutocomplete, refreshTagCache } from './TagAutocomplete';

interface PendingAttachment {
    id: number;
    type: 'image' | 'document' | 'text' | 'other';
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    human_size: string;
}

interface EntryInputProps {
    onOptimisticSubmit?: (content: string, attachments: PendingAttachment[]) => void;
}

interface AutocompleteState {
    active: boolean;
    sigil: string;
    query: string;
    startPos: number;
}

// File extensions we accept
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.markdown,.csv,.json,.html,.htm,.css,.js,.ts,.py,.sh,.bash';

// Get file icon based on type
function getFileIcon(type: string, mimeType: string): string {
    if (type === 'image') return '🖼️';
    if (type === 'document') return '📄';
    if (mimeType.includes('json')) return '{}';
    if (mimeType.includes('markdown') || mimeType.includes('text/plain')) return '📝';
    if (mimeType.includes('javascript') || mimeType.includes('typescript')) return '📜';
    if (mimeType.includes('python')) return '🐍';
    if (mimeType.includes('html') || mimeType.includes('css')) return '🌐';
    return '📎';
}

export function EntryInput({ onOptimisticSubmit }: EntryInputProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [autocomplete, setAutocomplete] = useState<AutocompleteState>({
        active: false,
        sigil: '',
        query: '',
        startPos: 0,
    });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Check for tag trigger on content change
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = content.slice(0, cursorPos);

        // Look for @ or # followed by word characters (no space after sigil)
        const match = textBeforeCursor.match(/([@#])([\w]*)$/);

        if (match) {
            const [fullMatch, sigil, query] = match;
            const startPos = cursorPos - fullMatch.length;
            setAutocomplete({
                active: true,
                sigil,
                query,
                startPos,
            });
        } else {
            setAutocomplete(prev => ({ ...prev, active: false }));
        }
    }, [content]);

    const handleTagSelect = (tag: { sigil: string; name: string }) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Replace the trigger text with the full tag
        const before = content.slice(0, autocomplete.startPos);
        const after = content.slice(textarea.selectionStart);

        // Use brackets for multi-word tags
        const tagText = tag.name.includes(' ')
            ? `${tag.sigil}[${tag.name}]`
            : `${tag.sigil}${tag.name}`;

        const newContent = before + tagText + ' ' + after;
        setContent(newContent);

        // Close autocomplete
        setAutocomplete(prev => ({ ...prev, active: false }));

        // Move cursor after the tag
        const newCursorPos = before.length + tagText.length + 1;
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const uploadFile = async (file: File): Promise<PendingAttachment | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/attachments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.attachment;
        } catch (error) {
            console.error('Failed to upload file:', error);
            return null;
        }
    };

    const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        const imageFiles: File[] = [];

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            setIsUploading(true);

            const uploaded = await Promise.all(
                imageFiles.map((file) => uploadFile(file))
            );

            const valid = uploaded.filter((a): a is PendingAttachment => a !== null);
            setPendingAttachments((prev) => [...prev, ...valid]);
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        const uploadPromises: Promise<PendingAttachment | null>[] = [];
        for (const file of files) {
            uploadPromises.push(uploadFile(file));
        }

        const uploaded = await Promise.all(uploadPromises);
        const valid = uploaded.filter((a): a is PendingAttachment => a !== null);
        setPendingAttachments((prev) => [...prev, ...valid]);
        setIsUploading(false);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = async (attachmentId: number) => {
        try {
            await axios.delete(`/attachments/${attachmentId}`);
            setPendingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    };

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        // Don't submit if autocomplete is active (might be selecting)
        if (autocomplete.active) return;

        // Allow submit if there's content OR attachments
        if ((!content.trim() && pendingAttachments.length === 0) || isSubmitting) return;

        const submittedContent = content || '(attachment)';
        const submittedAttachments = [...pendingAttachments];

        // Optimistic update - immediately show the entry and clear input
        onOptimisticSubmit?.(submittedContent, submittedAttachments);
        setContent('');
        setPendingAttachments([]);
        textareaRef.current?.focus();

        // Send to server in background
        router.post('/entries', {
            content: submittedContent,
            attachment_ids: submittedAttachments.map((a) => a.id),
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                // Refresh tag cache in background (new tags may have been created)
                refreshTagCache();
            },
            onError: () => {
                // Restore content on error
                setContent(submittedContent);
                setPendingAttachments(submittedAttachments);
            },
        });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // If autocomplete is active, let it handle navigation keys
        if (autocomplete.active) {
            if (['ArrowDown', 'ArrowUp', 'Tab', 'Escape'].includes(e.key)) {
                // These are handled by TagAutocomplete
                return;
            }
            if (e.key === 'Enter') {
                // Enter with autocomplete is handled by TagAutocomplete
                return;
            }
        }

        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const canSubmit = (content.trim() || pendingAttachments.length > 0) && !isSubmitting && !isUploading;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Pending attachments preview */}
            {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                        <div key={attachment.id} className="relative">
                            {attachment.type === 'image' ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.filename}
                                    className="h-20 w-20 object-cover rounded-xl border border-stone-200 dark:border-stone-700"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-xl border border-stone-200 dark:border-stone-700
                                               bg-stone-50 dark:bg-stone-800 flex flex-col items-center justify-center p-2">
                                    <span className="text-2xl mb-1">{getFileIcon(attachment.type, attachment.mime_type)}</span>
                                    <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate w-full text-center">
                                        {attachment.filename.length > 12
                                            ? attachment.filename.slice(0, 10) + '...'
                                            : attachment.filename}
                                    </span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => removeAttachment(attachment.id)}
                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5
                                           flex items-center justify-center text-xs font-bold
                                           hover:bg-rose-600 transition-colors"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                    {isUploading && (
                        <div className="h-20 w-20 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600
                                       flex items-center justify-center">
                            <span className="text-xs text-stone-400 dark:text-stone-500">Uploading...</span>
                        </div>
                    )}
                </div>
            )}

            <div ref={containerRef} className="relative flex items-center gap-2">
                {/* Tag Autocomplete */}
                {autocomplete.active && (
                    <TagAutocomplete
                        sigil={autocomplete.sigil}
                        query={autocomplete.query}
                        position={{ top: 0, left: 0 }}
                        onSelect={handleTagSelect}
                        onClose={() => setAutocomplete(prev => ({ ...prev, active: false }))}
                    />
                )}

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="What's on your mind?"
                    disabled={isSubmitting}
                    className="input-curio resize-none flex-1"
                    rows={1}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-gramm="false"
                    data-gramm_editor="false"
                    data-enable-grammarly="false"
                />

                {/* File upload button - tabIndex -1 to exclude from form navigation */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    tabIndex={-1}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting || isUploading}
                    className="flex-shrink-0 p-2 text-stone-400 hover:text-stone-600
                               dark:text-stone-500 dark:hover:text-stone-300
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors duration-150"
                    title="Upload file (images, PDFs, text)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-shrink-0 btn-primary"
                >
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
}

// Re-export for backwards compatibility
export type { PendingAttachment as PendingImage };

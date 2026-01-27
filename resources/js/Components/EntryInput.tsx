import { useState, useRef, useEffect, KeyboardEvent, FormEvent, ClipboardEvent, ChangeEvent } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface PendingImage {
    id: number;
    url: string;
    filename: string;
}

interface EntryInputProps {
    onOptimisticSubmit?: (content: string, images: PendingImage[]) => void;
}

export function EntryInput({ onOptimisticSubmit }: EntryInputProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const uploadImage = async (file: File): Promise<PendingImage | null> => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.image;
        } catch (error) {
            console.error('Failed to upload image:', error);
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

            const uploadedImages = await Promise.all(
                imageFiles.map((file) => uploadImage(file))
            );

            const validImages = uploadedImages.filter((img): img is PendingImage => img !== null);
            setPendingImages((prev) => [...prev, ...validImages]);
            setIsUploading(false);
        }
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        const uploadPromises: Promise<PendingImage | null>[] = [];
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                uploadPromises.push(uploadImage(file));
            }
        }

        const uploadedImages = await Promise.all(uploadPromises);
        const validImages = uploadedImages.filter((img): img is PendingImage => img !== null);
        setPendingImages((prev) => [...prev, ...validImages]);
        setIsUploading(false);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = async (imageId: number) => {
        try {
            await axios.delete(`/images/${imageId}`);
            setPendingImages((prev) => prev.filter((img) => img.id !== imageId));
        } catch (error) {
            console.error('Failed to delete image:', error);
        }
    };

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        // Allow submit if there's content OR images
        if ((!content.trim() && pendingImages.length === 0) || isSubmitting) return;

        const submittedContent = content || '(image)';
        const submittedImages = [...pendingImages];

        // Optimistic update - immediately show the entry and clear input
        onOptimisticSubmit?.(submittedContent, submittedImages);
        setContent('');
        setPendingImages([]);
        textareaRef.current?.focus();

        // Send to server in background
        router.post('/entries', {
            content: submittedContent,
            image_ids: submittedImages.map((img) => img.id),
        }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                // Restore content on error
                setContent(submittedContent);
                setPendingImages(submittedImages);
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

    const canSubmit = (content.trim() || pendingImages.length > 0) && !isSubmitting && !isUploading;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Pending images preview */}
            {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {pendingImages.map((image) => (
                        <div key={image.id} className="relative">
                            <img
                                src={image.url}
                                alt={image.filename}
                                className="h-20 w-20 object-cover rounded-xl border border-stone-200 dark:border-stone-700"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(image.id)}
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

            <div className="flex items-center gap-2">
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

                {/* Image upload button - tabIndex -1 to exclude from form navigation */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
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
                    title="Upload image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

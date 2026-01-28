import Modal from './Modal';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Props {
    show: boolean;
    activeTag: Tag | null;
    onAddTag: () => void;
    onPostWithout: () => void;
    onCancel: () => void;
}

export function FilterMismatchModal({ show, activeTag, onAddTag, onPostWithout, onCancel }: Props) {
    if (!activeTag) return null;

    return (
        <Modal show={show} maxWidth="sm" onClose={onCancel}>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-center text-stone-900 dark:text-stone-100 mb-2">
                    Add tag to entry?
                </h3>

                <p className="text-sm text-center text-stone-600 dark:text-stone-400 mb-6">
                    You're currently filtering by <span className="font-medium text-stone-800 dark:text-stone-200">{activeTag.sigil}{activeTag.name}</span>. Add this tag to your entry?
                </p>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onAddTag}
                        className="w-full px-4 py-2.5 rounded-lg bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-medium text-sm hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                    >
                        Yes, add {activeTag.sigil}{activeTag.name}
                    </button>
                    <button
                        onClick={onPostWithout}
                        className="w-full px-4 py-2.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                    >
                        No, post without it
                    </button>
                </div>
            </div>
        </Modal>
    );
}

interface PostedWithoutTagModalProps {
    show: boolean;
    activeTag: Tag | null;
    onViewEntry: () => void;
    onStayHere: () => void;
}

export function PostedWithoutTagModal({ show, activeTag, onViewEntry, onStayHere }: PostedWithoutTagModalProps) {
    return (
        <Modal show={show} maxWidth="sm" onClose={onStayHere}>
            <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-lg font-semibold text-center text-stone-900 dark:text-stone-100 mb-2">
                    Entry saved!
                </h3>

                <p className="text-sm text-center text-stone-600 dark:text-stone-400 mb-6">
                    Your entry won't appear here because it doesn't have the {activeTag?.sigil}{activeTag?.name} tag.
                </p>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={onViewEntry}
                        className="w-full px-4 py-2.5 rounded-lg bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-medium text-sm hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                    >
                        View Entry
                    </button>
                    <button
                        onClick={onStayHere}
                        className="w-full px-4 py-2.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-sm hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                    >
                        Stay in {activeTag?.sigil}{activeTag?.name}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

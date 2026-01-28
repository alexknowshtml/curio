import Modal from './Modal';

interface Props {
    show: boolean;
    onViewEntry: () => void;
    onStayHere: () => void;
}

export function FilterMismatchModal({ show, onViewEntry, onStayHere }: Props) {
    return (
        <Modal show={show} maxWidth="sm" onClose={onStayHere}>
            <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-lg font-semibold text-center text-stone-900 dark:text-stone-100 mb-2">
                    Entry saved!
                </h3>

                <p className="text-sm text-center text-stone-600 dark:text-stone-400 mb-6">
                    Your entry won't appear here because it doesn't match your current filter.
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
                        Stay Here
                    </button>
                </div>
            </div>
        </Modal>
    );
}

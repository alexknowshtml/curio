import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { EntryInput } from '@/Components/EntryInput';
import { EntryBubble } from '@/Components/EntryBubble';

interface Tag {
    id: number;
    sigil: string;
    name: string;
}

interface Entry {
    id: number;
    content: string;
    created_at: string;
    tags: Tag[];
}

interface Props {
    entries: Entry[];
    allTags: Tag[];
    activeTagId: string | null;
}

// Color classes for each sigil type (matching EntryBubble)
const sigilColors: Record<string, string> = {
    '#': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    '@': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    '$': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    '!': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    '~': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export default function Stream({ entries, allTags, activeTagId }: Props) {
    const handleTagClick = (tagId: number | null) => {
        if (tagId === null) {
            router.get('/stream', {}, { preserveState: true });
        } else {
            router.get('/stream', { tag: tagId }, { preserveState: true });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Stream
                </h2>
            }
        >
            <Head title="Stream" />

            <div className="flex flex-col h-[calc(100vh-8rem)] pt-[env(safe-area-inset-top)]">
                {/* Tag filter bar */}
                {allTags && allTags.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                        <div className="mx-auto max-w-3xl flex flex-wrap gap-2">
                            <button
                                onClick={() => handleTagClick(null)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                           ${!activeTagId
                                               ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
                                               : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                           }`}
                            >
                                All
                            </button>
                            {allTags.map((tag) => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.id)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                               ${activeTagId && parseInt(activeTagId) === tag.id
                                                   ? 'ring-2 ring-offset-1 ring-gray-800 dark:ring-white ' + sigilColors[tag.sigil]
                                                   : sigilColors[tag.sigil] + ' hover:opacity-80'
                                               }`}
                                >
                                    {tag.sigil}{tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entry stream - scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-6 pb-[env(safe-area-inset-bottom)]">
                    <div className="mx-auto max-w-3xl space-y-4">
                        {entries.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p className="text-lg">No entries yet.</p>
                                <p className="text-sm mt-2">Start capturing your thoughts below.</p>
                            </div>
                        ) : (
                            entries.map((entry) => (
                                <EntryBubble key={entry.id} entry={entry} onTagClick={handleTagClick} />
                            ))
                        )}
                    </div>
                </div>

                {/* Entry input - fixed at bottom */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-[env(safe-area-inset-bottom)]">
                    <div className="mx-auto max-w-3xl px-4 py-4">
                        <EntryInput />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

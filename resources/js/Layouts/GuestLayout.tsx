import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-stone-100 dark:bg-stone-900 pt-6 sm:justify-center sm:pt-0">
            <div className="mb-6">
                <Link href="/" className="flex flex-col items-center gap-3">
                    {/* Curio icon */}
                    <div className="w-16 h-16 rounded-2xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center shadow-sm">
                        <span className="text-4xl font-serif text-amber-800 dark:text-amber-600">C</span>
                    </div>
                    <span className="text-xl font-semibold text-stone-700 dark:text-stone-300">Curio</span>
                </Link>
            </div>

            <div className="w-full overflow-hidden bg-white dark:bg-stone-800 px-6 py-6 shadow-lg border border-stone-200 dark:border-stone-700 sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}

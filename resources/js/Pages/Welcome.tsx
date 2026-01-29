import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
}: PageProps) {
    return (
        <>
            <Head title="Curio" />
            <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col">
                {/* Simple header */}
                <header className="p-6">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-stone-800 dark:bg-stone-200 flex items-center justify-center">
                                <span className="text-stone-100 dark:text-stone-800 font-semibold text-sm">C</span>
                            </div>
                            <span className="text-lg font-semibold text-stone-800 dark:text-stone-100">Curio</span>
                        </div>
                        <nav className="flex gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('home')}
                                    className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-800 font-medium text-sm hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
                                >
                                    Open Curio
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 font-medium text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-800 font-medium text-sm hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero section */}
                <main className="flex-1 flex items-center justify-center px-6">
                    <div className="max-w-2xl text-center">
                        <h1 className="text-4xl sm:text-5xl font-bold text-stone-800 dark:text-stone-100 mb-6">
                            A quieter place for your thoughts
                        </h1>
                        <p className="text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-lg mx-auto">
                            Curio is a simple, personal journal that stays out of your way.
                            No likes, no followers, no algorithm. Just you and your thoughts.
                        </p>
                        {!auth.user && (
                            <div className="flex gap-3 justify-center">
                                <Link
                                    href={route('register')}
                                    className="px-6 py-3 rounded-xl bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-800 font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
                                >
                                    Start writing
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </div>
                        )}
                    </div>
                </main>

                {/* Simple footer */}
                <footer className="p-6 text-center text-sm text-stone-500 dark:text-stone-500">
                    A personal project
                </footer>
            </div>
        </>
    );
}

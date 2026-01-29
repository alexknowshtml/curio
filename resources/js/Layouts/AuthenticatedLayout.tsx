import { ThemeToggle } from '@/Components/ThemeToggle';
import { GlobalSearch } from '@/Components/GlobalSearch';
import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect, useRef } from 'react';

export default function Authenticated({ children }: PropsWithChildren) {
    const { user, isAdmin } = usePage().props.auth;
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside or pressing Escape
    useEffect(() => {
        if (!showMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showMenu]);

    return (
        <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-900">
            {/* Minimal header */}
            <header className="flex-shrink-0 border-b border-stone-200/50 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm relative z-50">
                <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto w-full gap-4">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            const currentPath = window.location.pathname;
                            // Check for filters in both query params (legacy) and clean URL paths
                            const hasQueryFilters = window.location.search.includes('tag=') || window.location.search.includes('date=');
                            const hasPathFilters = currentPath !== '/home' && currentPath.startsWith('/home/');

                            if (currentPath === '/home' && !hasQueryFilters) {
                                // Already on home with no filters - just scroll to bottom
                                const scrollContainer = document.querySelector('[data-stream-container]');
                                if (scrollContainer) {
                                    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
                                }
                            } else {
                                // Navigate to home (clears any filters or leaves other pages)
                                router.visit('/home', { preserveState: false });
                            }
                        }}
                        className="text-lg font-semibold text-stone-800 dark:text-stone-100 tracking-tight flex-shrink-0"
                    >
                        Curio
                    </button>

                    <GlobalSearch />

                    <div className="relative flex-shrink-0" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                            <span className="text-sm font-medium">{user.name}</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div className={`absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-stone-800 shadow-lg border border-stone-200/50 dark:border-stone-700/50 py-1 z-[100] transition-all duration-150 origin-top-right ${showMenu ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <ThemeToggle />
                                <div className="border-t border-stone-200/50 dark:border-stone-700/50 my-1"></div>
                                {isAdmin && (
                                    <Link
                                        href={route('admin.users')}
                                        className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                    >
                                        Admin
                                    </Link>
                                )}
                                <Link
                                    href={route('profile.edit')}
                                    className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                >
                                    Profile
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="block w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50"
                                >
                                    Sign out
                                </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}

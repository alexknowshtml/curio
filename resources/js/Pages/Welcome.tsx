import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

function CompactThemeToggle() {
    const [theme, setTheme] = useState<Theme>('system');

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored) {
            setTheme(stored);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system') {
            localStorage.removeItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', systemPrefersDark);
        } else {
            localStorage.setItem('theme', theme);
            root.classList.toggle('dark', theme === 'dark');
        }
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            document.documentElement.classList.toggle('dark', e.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    const cycleTheme = () => {
        const themes: Theme[] = ['system', 'light', 'dark'];
        const currentIndex = themes.indexOf(theme);
        setTheme(themes[(currentIndex + 1) % themes.length]);
    };

    const icons = {
        system: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        light: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        dark: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        ),
    };

    const labels = { system: 'System', light: 'Light', dark: 'Dark' };

    return (
        <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={`Theme: ${labels[theme]}`}
        >
            {icons[theme]}
        </button>
    );
}

const PLACEHOLDERS = [
    "What are you avoiding?",
    "Try the opposite?",
    "What if this were easy?",
    "What's the real question?",
    "What's missing?",
    "Overcomplicating this?",
    "What's the smallest step?",
    "What are you not saying?",
    "What would make this fun?",
    "What's obvious here?",
    "What if you did nothing?",
    "What's simpler?",
    "What would a friend say?",
    "What's worth remembering?",
    "What sparked this?",
];

export default function Welcome({
    auth,
}: PageProps) {
    const [placeholderIndex, setPlaceholderIndex] = useState(() =>
        Math.floor(Math.random() * PLACEHOLDERS.length)
    );

    // Rotate placeholder every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const entries: { text: ReactNode; time: string }[] = [
        { text: "have you ever noticed that it's easier to start typing into an empty chat box than a blank document?", time: "9:46 PM" },
        { text: <>maybe it's because i grew up in chat rooms, or because i wrote <a href="https://tiny.mba" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-500 hover:underline">my best work</a> 140 characters at a time on twitter</>, time: "9:47 PM" },
        { text: "but for a lot of us, the easiest drafting mode is a tiny text box.", time: "9:47 PM" },
        { text: <>that's why i made curio, a simple chat ui for turning your <em>inner monologue</em> into your <strong>newest rough drafts</strong></>, time: "9:48 PM" },
        { text: "no setup. no folders. no templates. just start typing.", time: "9:49 PM" },
        { text: <>want to organize your thoughts? drop an <span className="inline-flex px-1.5 py-0.5 rounded text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">@project</span> or <span className="inline-flex px-1.5 py-0.5 rounded text-sm bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">#idea</span> tag anywhere. they become filters automatically. build your own system as you go.</>, time: "9:50 PM" },
        { text: "need to find something you wrote last week? just search. everything is instantly searchable.", time: "9:51 PM" },
        { text: "works on your phone, your laptop, wherever. save it to your dock or homescreen for the best experience.", time: "9:52 PM" },
        { text: "your data is encrypted on our servers. full end-to-end encryption is coming soon for those who want the extra layer.", time: "9:53 PM" },
        { text: <>use my hosted version or <a href="https://github.com/alexknowshtml/curio" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-500 hover:underline">run it yourself</a> if you're into that.</>, time: "9:54 PM" },
    ];

    return (
        <>
            <Head title="Curio" />
            <div className="h-screen bg-stone-50 dark:bg-stone-900 flex flex-col overflow-hidden">
                {/* Header mimicking the app */}
                <header className="flex-shrink-0 border-b border-stone-200/50 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto w-full">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-stone-800 dark:text-stone-100">Curio</span>
                        </div>
                        <nav className="flex items-center gap-2">
                            <CompactThemeToggle />
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

                {/* Stream-style content */}
                <main className="flex-1 overflow-y-auto min-h-0">
                    <div className="max-w-2xl mx-auto px-4 py-8">
                        {/* Date header */}
                        <div className="text-center mb-6">
                            <span className="text-xs text-stone-500 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
                                Today
                            </span>
                        </div>

                        {/* Entries */}
                        <div className="space-y-4">
                            {entries.map((entry, i) => (
                                <div key={i} className="group">
                                    <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 shadow-sm border border-stone-100 dark:border-stone-700/50">
                                        <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                                            {entry.text}
                                        </p>
                                    </div>
                                    <div className="text-right mt-1 pr-2">
                                        <span className="text-xs text-stone-400 dark:text-stone-500">
                                            {entry.time}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* CTA entry */}
                            <div className="group">
                                <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 shadow-sm border border-stone-100 dark:border-stone-700/50">
                                    <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                                        ready to try it?{' '}
                                        <Link
                                            href={route('register')}
                                            className="text-amber-600 dark:text-amber-500 hover:underline"
                                        >
                                            sign up free
                                        </Link>
                                    </p>
                                </div>
                                <div className="text-right mt-1 pr-2">
                                    <span className="text-xs text-stone-400 dark:text-stone-500">
                                        9:55 PM
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Fake input area with rotating prompts */}
                <div className="flex-shrink-0 border-t border-stone-200/50 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4">
                    <div className="max-w-2xl mx-auto">
                        <Link
                            href={route('register')}
                            className="block w-full bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 text-stone-400 dark:text-stone-500 text-[15px] border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors cursor-pointer"
                        >
                            {PLACEHOLDERS[placeholderIndex]}
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex-shrink-0 pt-0 pb-8 text-center">
                    <p className="text-sm text-stone-400 dark:text-stone-500">
                        Brought to you by Amy & Alex at{' '}
                        <a
                            href="https://stackingthebricks.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 dark:text-amber-500 hover:underline"
                        >
                            Stacking the Bricks
                        </a>
                    </p>
                </footer>
            </div>
        </>
    );
}

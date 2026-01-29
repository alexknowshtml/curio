import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

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

// Mock UI Components that look like the real app
const MockEntry = ({ children, time }: { children: React.ReactNode; time: string }) => (
    <div className="group">
        <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 shadow-sm border border-stone-100 dark:border-stone-700/50">
            {children}
        </div>
        <div className="text-right mt-1 pr-2">
            <span className="text-xs text-stone-400 dark:text-stone-500">{time}</span>
        </div>
    </div>
);

const MockTag = ({ children, type = 'person' }: { children: string; type?: 'person' | 'project' }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        type === 'person'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    }`}>
        {type === 'person' ? '@' : '#'}{children}
    </span>
);

const MockImage = () => (
    <div className="mt-2 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-rose-900/20 aspect-video flex items-center justify-center">
        <svg className="w-12 h-12 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    </div>
);

const MockDateFilter = () => (
    <div className="flex items-center gap-2 justify-center">
        <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
            Yesterday
        </button>
        <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-800">
            Today
        </button>
        <button className="px-3 py-1.5 text-xs font-medium rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Jan 28
        </button>
    </div>
);

const MockInput = ({ placeholder }: { placeholder: string }) => (
    <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 text-[15px]">
        {placeholder}
    </div>
);

// Entry type for the landing page content
type LandingEntry = {
    text?: string;
    time: string;
    component?: React.ReactNode;
};

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

    const entries: LandingEntry[] = [
        { text: "have you ever noticed that it's easier to start typing into an empty chat box than a blank document?", time: "9:46 PM" },
        { text: "maybe it's because i grew up in chat rooms, or because i wrote many books worth of my best work 140 characters at a time on twitter", time: "9:47 PM" },
        { text: "but for a lot of us, the easiest drafting mode is a tiny text box.", time: "9:47 PM" },
        { text: "that's why i made curio, a simple chat ui for turning your inner monologue into something more useful than anxiety", time: "9:48 PM" },
        { text: "just type what's on your mind. curio saves it automatically as you go.", time: "9:48 PM" },
        // Mock: input with rotating prompt
        {
            time: "",
            component: (
                <div className="my-2">
                    <MockInput placeholder="What's the smallest step?" />
                </div>
            )
        },
        { text: "tag people and projects with @mentions - they become filters so you can find everything later", time: "9:49 PM" },
        // Mock: entry with tags
        {
            time: "9:49 PM",
            component: (
                <MockEntry time="9:49 PM">
                    <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                        talked to <MockTag>amy</MockTag> about the <MockTag type="project">curio</MockTag> launch - she had great ideas about the onboarding flow
                    </p>
                </MockEntry>
            )
        },
        { text: "drop in images, screenshots, files. they just go with your thought.", time: "9:50 PM" },
        // Mock: entry with image
        {
            time: "9:50 PM",
            component: (
                <MockEntry time="9:50 PM">
                    <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                        this sketch from the whiteboard session
                    </p>
                    <MockImage />
                </MockEntry>
            )
        },
        { text: "tap a date to see just that day. yesterday, today, or pick from the calendar.", time: "9:51 PM" },
        // Mock: date filter
        {
            time: "",
            component: (
                <div className="my-4">
                    <MockDateFilter />
                </div>
            )
        },
        { text: "it's private, it's yours, it's simple. no likes, no followers, no algorithm.", time: "9:52 PM" },
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
                                <div key={i}>
                                    {entry.component ? (
                                        entry.component
                                    ) : (
                                        <MockEntry time={entry.time}>
                                            <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                                                {entry.text}
                                            </p>
                                        </MockEntry>
                                    )}
                                </div>
                            ))}

                            {/* CTA entry */}
                            <MockEntry time="9:53 PM">
                                <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                                    it's free to try at{' '}
                                    <Link
                                        href={route('register')}
                                        className="text-amber-600 dark:text-amber-500 hover:underline"
                                    >
                                        curio.stackingthebricks.com
                                    </Link>
                                </p>
                            </MockEntry>
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

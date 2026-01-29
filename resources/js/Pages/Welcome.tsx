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

// Entry type for the landing page content
type LandingEntry = {
    text: string;
    time: string;
    screenshot?: string; // Path to screenshot image
    screenshotAlt?: string;
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
        // Screenshot: empty stream with rotating prompt
        { text: "just type what's on your mind. curio saves it automatically as you go.", time: "9:48 PM", screenshot: "/images/landing/stream-empty.png", screenshotAlt: "Empty Curio stream with rotating prompt" },
        { text: "tag people and projects with @mentions - they become filters so you can find everything about @amy or #curio later", time: "9:49 PM", screenshot: "/images/landing/tags.png", screenshotAlt: "Entry with @amy tag showing tag pill styling" },
        { text: "drop in images, screenshots, files. they just go with your thought.", time: "9:49 PM", screenshot: "/images/landing/attachment.png", screenshotAlt: "Entry with an image attached" },
        { text: "tap a date to see just that day. tap yesterday, today, or browse the calendar.", time: "9:50 PM", screenshot: "/images/landing/date-filter.png", screenshotAlt: "Date filter buttons and calendar picker" },
        { text: "it's private, it's yours, it's simple. no likes, no followers, no algorithm.", time: "9:50 PM" },
    ];

    // Screenshot placeholder component
    const ScreenshotPlaceholder = ({ src, alt }: { src: string; alt: string }) => (
        <div className="my-4 flex justify-center">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-700 max-w-sm">
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto"
                    onError={(e) => {
                        // Show placeholder if image doesn't exist yet
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                            <div class="bg-stone-100 dark:bg-stone-800 px-8 py-16 text-center">
                                <p class="text-stone-400 dark:text-stone-500 text-sm">[Screenshot: ${alt}]</p>
                            </div>
                        `;
                    }}
                />
            </div>
        </div>
    );

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
                                    <div className="group">
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
                                    {entry.screenshot && (
                                        <ScreenshotPlaceholder src={entry.screenshot} alt={entry.screenshotAlt || ''} />
                                    )}
                                </div>
                            ))}

                            {/* CTA entry */}
                            <div className="group">
                                <div className="bg-white dark:bg-stone-800 rounded-2xl px-4 py-3 shadow-sm border border-stone-100 dark:border-stone-700/50">
                                    <p className="text-stone-800 dark:text-stone-200 text-[15px] leading-relaxed">
                                        it's free to try at{' '}
                                        <Link
                                            href={route('register')}
                                            className="text-amber-600 dark:text-amber-500 hover:underline"
                                        >
                                            curio.stackingthebricks.com
                                        </Link>
                                    </p>
                                </div>
                                <div className="text-right mt-1 pr-2">
                                    <span className="text-xs text-stone-400 dark:text-stone-500">
                                        9:51 PM
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

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
        <meta name="theme-color" content="#1C1917" media="(prefers-color-scheme: dark)">
        <meta name="theme-color" content="#FAF7F5" media="(prefers-color-scheme: light)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Curio">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="format-detection" content="telephone=no">

        <title inertia>{{ config('app.name', 'Curio') }}</title>

        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">

        <!-- Fonts: Source Serif for prose, Inter for UI -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600|source-serif-4:400,400i,500,600&display=swap" rel="stylesheet" />

        <!-- Dark mode initialization - MUST run before page renders to prevent flash -->
        <script>
            (function() {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                }
            })();
        </script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead

        <!-- Service Worker Registration -->
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js');
                });
            }
        </script>
    </head>
    <body class="font-sans antialiased overflow-hidden bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
        <div id="app">
            @inertia
        </div>
    </body>
</html>

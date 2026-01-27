import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// iOS Safari keyboard viewport fix
// Sets --keyboard-offset CSS variable to the bottom offset when keyboard opens
function updateKeyboardOffset() {
    const vv = window.visualViewport;
    if (!vv) return;

    // In Safari browser, when keyboard opens the visual viewport shrinks and scrolls up
    // We need to position the input at the bottom of the visual viewport
    // The offset is where the bottom of the visual viewport sits relative to the page
    const bottomOfVisualViewport = vv.offsetTop + vv.height;
    const bottomOfLayoutViewport = document.documentElement.clientHeight;
    const offset = bottomOfLayoutViewport - bottomOfVisualViewport;

    document.documentElement.style.setProperty('--keyboard-offset', `${Math.max(0, offset)}px`);
}

updateKeyboardOffset();
window.visualViewport?.addEventListener('resize', updateKeyboardOffset);
window.visualViewport?.addEventListener('scroll', updateKeyboardOffset);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

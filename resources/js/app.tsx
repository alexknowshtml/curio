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

    // Calculate how much the visual viewport is offset from the layout viewport
    const offset = window.innerHeight - vv.height - vv.offsetTop;
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

import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

// iOS Safari keyboard viewport fix
// When keyboard is open, we need to transform the input bar to stay visible
function updateKeyboardPosition() {
    const vv = window.visualViewport;
    if (!vv) return;

    const inputBar = document.querySelector('[data-input-bar]') as HTMLElement;
    if (!inputBar) return;

    // Calculate the offset needed to position the input at the bottom of the visual viewport
    const bottomOfVisualViewport = vv.offsetTop + vv.height;
    const bottomOfLayoutViewport = document.documentElement.clientHeight;
    const keyboardOffset = bottomOfLayoutViewport - bottomOfVisualViewport;

    if (keyboardOffset > 50) {
        // Keyboard is likely open - transform the input up
        inputBar.style.transform = `translateY(-${keyboardOffset}px)`;
    } else {
        // Keyboard closed - reset transform
        inputBar.style.transform = '';
    }
}

updateKeyboardPosition();
window.visualViewport?.addEventListener('resize', updateKeyboardPosition);
window.visualViewport?.addEventListener('scroll', updateKeyboardPosition);

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

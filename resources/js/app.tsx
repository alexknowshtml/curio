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

    // Debug: log the values (remove after debugging)
    console.log('KB Debug:', {
        vvHeight: vv.height,
        vvOffsetTop: vv.offsetTop,
        bottomOfVV: bottomOfVisualViewport,
        bottomOfLV: bottomOfLayoutViewport,
        offset: keyboardOffset
    });

    if (keyboardOffset > 50) {
        // Keyboard is likely open - transform the input up
        inputBar.style.transform = `translateY(-${keyboardOffset}px)`;
    } else {
        // Keyboard closed - reset transform
        inputBar.style.transform = '';
    }
}

// Run continuously during keyboard animation for smoother positioning
let animationFrameId: number | null = null;
function scheduleUpdate() {
    if (animationFrameId) return;
    animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        updateKeyboardPosition();
    });
}

updateKeyboardPosition();
window.visualViewport?.addEventListener('resize', scheduleUpdate);
window.visualViewport?.addEventListener('scroll', scheduleUpdate);

// Also listen for focus/blur on inputs to catch keyboard earlier
document.addEventListener('focusin', (e) => {
    if ((e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') {
        // Poll for a bit as keyboard animates in
        const pollEnd = Date.now() + 500;
        const poll = () => {
            updateKeyboardPosition();
            if (Date.now() < pollEnd) requestAnimationFrame(poll);
        };
        poll();
    }
});
document.addEventListener('focusout', () => {
    // Poll as keyboard animates out
    const pollEnd = Date.now() + 300;
    const poll = () => {
        updateKeyboardPosition();
        if (Date.now() < pollEnd) requestAnimationFrame(poll);
    };
    poll();
});

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

import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                serif: ['Source Serif 4', ...defaultTheme.fontFamily.serif],
            },
            colors: {
                paper: 'var(--color-paper)',
                'paper-subtle': 'var(--color-paper-subtle)',
                ink: 'var(--color-ink)',
                'ink-muted': 'var(--color-ink-muted)',
                'ink-subtle': 'var(--color-ink-subtle)',
            },
        },
    },

    plugins: [forms, typography],
};

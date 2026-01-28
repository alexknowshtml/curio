import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current directory
    const env = loadEnv(mode, process.cwd(), '');

    return {
        define: {
            // Explicitly pass VITE_APP_NAME to ensure it's always available
            'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Curio'),
        },
        plugins: [
            laravel({
                input: 'resources/js/app.tsx',
                refresh: true,
            }),
            react(),
        ],
    };
});

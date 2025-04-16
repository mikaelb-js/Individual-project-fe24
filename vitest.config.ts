import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        include: ['**/*.test.{ts,tsx}'],
        alias: {
            '@server': path.resolve(__dirname, './app/lib/server'),
            '@app': path.resolve(__dirname, './app'),
        },
        setupFiles: ['./setup-tests.mjs'],
    },
});
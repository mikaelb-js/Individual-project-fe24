// app.config.ts
import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    vite: {
        ssr: { external: ['drizzle-orm'] },
        plugins: [
            tsConfigPaths({
                projects: ['./tsconfig.json'],
            }),
        ],
    },
});
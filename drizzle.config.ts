import type { Config } from 'drizzle-kit';
import '@dotenvx/dotenvx/config';

export default {
    out: './drizzle',
    schema: './app/lib/server/schema/db.schema.ts',
    breakpoints: true,
    verbose: true,
    strict: true,
    dialect: 'postgresql',
    casing: 'snake_case',
    dbCredentials: {
        url: process.env.POSTGRES_URL!,
    }
} satisfies Config;
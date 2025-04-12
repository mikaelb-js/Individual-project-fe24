import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import * as schema from './schema';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const POSTGRES_CONNECTION = process.env.POSTGRES_DB_URL!;
const DB_CONNECTION = process.env.POSTGRES_URL!;

if (!POSTGRES_CONNECTION || !DB_CONNECTION) {
    console.error('Error: Database connection strings not found');
    process.exit(1);
}

const MIGRATIONS = './drizzle/migrations';

async function ensureDatabaseExists() {
    console.log('Connecting to default postgres database...');
    const sql = postgres(POSTGRES_CONNECTION);

    try {
        // database exists?
        console.log('Checking if organisationsDB exists...');
        const dbExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM pg_database WHERE datname = 'organisationsDB'
            ) as exists
        `;

        // Create database if not exists
        if (!dbExists[0].exists) {
            console.log('Creating database organisationsDB...');
            await sql`CREATE DATABASE "organisationsDB"`;
            console.log('Database created successfully');
        } else {
            console.log('Database organisationsDB already exists');
        }
    } catch (error) {
        console.error('Error checking/creating database:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

async function ensureMigrationFolders() {
    const metaFolder = join(MIGRATIONS, 'meta');
    try {
        await mkdir(MIGRATIONS, { recursive: true });
        await mkdir(metaFolder, { recursive: true });
    } catch (error) {
        // Ignore errors
    }
}

async function runMigrations() {
    const sql = postgres(DB_CONNECTION, { max: 1 });
    const db = drizzle(sql, { schema });

    try {
        console.log('Running migrations...');
        await migrate(db, { migrationsFolder: MIGRATIONS });

        // Verify tables were created
        const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        console.log('Tables after migration:', tables.map(t => t.tablename));

        console.log('Migrations complete!');
    } catch (error: unknown) {
        //Postgres error Type assertion 
        const pgError = error as { code?: string };

        if (pgError.code === '42P07') {
            console.log('Tables already exist. This is not a problem.');
            try {
                const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
                console.log('Existing tables:', tables.map(t => t.tablename));
            } catch {/* ignore */ }
        } else {
            console.error('Migration error:', error);
            throw error;
        }
    } finally {
        // Always need this to close the connection
        await sql.end();
    }
}

async function main() {
    try {
        await ensureDatabaseExists();
        await ensureMigrationFolders();
        await runMigrations();
    } catch (error) {
        console.error('Migration process failed:', error);
        process.exit(1);
    }
}

main();
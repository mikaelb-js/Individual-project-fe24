import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import * as schema from './schema';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import fs from 'fs/promises';
import path from 'path';

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

async function resetMigrationJournal() {
    console.log('Checking migration journal status...');

    const sql = postgres(DB_CONNECTION);
    try {
        // Check if the journal table exists
        const journalExists = await sql`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'drizzle' 
                AND table_name = '__drizzle_migrations'
            ) as exists
        `;

        if (journalExists[0].exists) {
            // Check what migrations have been applied
            const appliedMigrations = await sql`SELECT * FROM drizzle.__drizzle_migrations`;

            if (appliedMigrations.length > 0) {
                console.log(`Found ${appliedMigrations.length} applied migrations in journal`);

                // Check if tables actually exist
                const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
                const tableNames = tables.map(t => t.tablename);

                // Expected tables from schema
                const expectedTables = ['organisations', 'partners'];
                const missingTables = expectedTables.filter(t => !tableNames.includes(t));

                if (missingTables.length > 0) {
                    console.log(`Migration journal shows completed migrations but ${missingTables.length} tables are missing`);
                    console.log('Resetting migration journal to fix inconsistency...');

                    // Reset the journal to force migrations to run again
                    await sql`TRUNCATE drizzle.__drizzle_migrations`;
                    console.log('Migration journal reset successfully');
                }
            }
        }
    } catch (error) {
        console.warn('Error checking migration journal:', error);
    } finally {
        await sql.end();
    }
}

async function runMigrations() {
    const sql = postgres(DB_CONNECTION, { max: 1 });
    const db = drizzle(sql, { schema });

    try {
        // Debug: List migration files that will be applied
        console.log('Reading migration files...');
        const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS });
        console.log(`Found ${migrations.length} migration file(s):`);
        migrations.forEach((migration, i) => {
            console.log(`${i + 1}. Hash: ${migration.hash}`);
            console.log(`   SQL statements: ${migration.sql.length}`);
            if (process.env.DEBUG === 'true') {
                console.log('   SQL content:');
                migration.sql.forEach((stmt, j) => console.log(`     ${j + 1}. ${stmt.substring(0, 80)}...`));
            }
        });

        // Debug: Check for existing tables before migration
        const tablesBefore = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        console.log('Tables before migration:', tablesBefore.map(t => t.tablename));

        // Run migrations
        console.log('Running migrations...');
        await migrate(db, { migrationsFolder: MIGRATIONS });

        // Debug: Check for tables after migration
        const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        console.log('Tables after migration:', tables.map(t => t.tablename));

        // Compare before and after
        const newTables = tables
            .filter(t => !tablesBefore.some(tb => tb.tablename === t.tablename))
            .map(t => t.tablename);

        if (newTables.length > 0) {
            console.log(`✅ Migration created ${newTables.length} new tables: ${newTables.join(', ')}`);
        } else {
            console.log('⚠️ No new tables were created by the migration');
        }

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
        await resetMigrationJournal(); // Add this
        await runMigrations();
    } catch (error) {
        console.error('Migration process failed:', error);
        process.exit(1);
    }
}

main();
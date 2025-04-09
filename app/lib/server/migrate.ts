import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import { sql } from 'drizzle-orm';
import { mkdir, access } from 'fs/promises';
import { join } from 'path';

const connectionString = process.env.POSTGRES_URL!;
const MIGRATIONS_FOLDER = 'drizzle/migrations';
const META_FOLDER = join(MIGRATIONS_FOLDER, 'meta');

async function ensureMigrationFolders() {
    try {
        await access(MIGRATIONS_FOLDER);
        await access(META_FOLDER);
    } catch {
        console.log('Creating migration folders...');
        await mkdir(MIGRATIONS_FOLDER, { recursive: true });
        await mkdir(META_FOLDER, { recursive: true });
    }
}

async function dropTables(db: any) {
    console.log('Dropping existing tables...');
    await db.execute(sql`
        DROP TABLE IF EXISTS items CASCADE;
        DROP TABLE IF EXISTS _journal CASCADE;
        DROP TABLE IF EXISTS organisations CASCADE;
    `);
    console.log('Tables dropped successfully');
}

async function main() {
    await ensureMigrationFolders();

    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    await dropTables(db);

    console.log('Running migrations...');
    await migrate(db, {
        migrationsFolder: MIGRATIONS_FOLDER
    });

    console.log('Migrations complete!');
    await sql.end();
}

main().catch((err) => {
    console.error('Migration failed!', err);
    process.exit(1);
});
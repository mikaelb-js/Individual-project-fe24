import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';

const connectionString = process.env.POSTGRES_URL!;

async function main() {
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    console.log('Running migrations...');

    await migrate(db, {
        migrationsFolder: 'drizzle/migrations'
    });

    console.log('Migrations complete!');
    await sql.end();
}

main().catch((err) => {
    console.error('Migration failed!', err);
    process.exit(1);
});
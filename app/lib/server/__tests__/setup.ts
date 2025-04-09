import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { organisations } from '../schema/db.schema';
import 'dotenv/config';

if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable not set');
}

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

export async function setupTestDatabase() {
    // Drop and recreate the organisations table
    await sql`DROP TABLE IF EXISTS organisations CASCADE`;
    await sql`
        CREATE TABLE organisations (
            id VARCHAR PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT,
            office JSONB,
            contact JSONB,
            region_of_operations JSONB,
            about JSONB,
            main_achievements JSONB,
            operations JSONB,
            engagement JSONB,
            voices_about JSONB
        );
    `;
}

export async function cleanupTestDatabase() {
    // Clean up all data but keep the table structure
    await sql`TRUNCATE TABLE organisations CASCADE`;
}
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { items } from '../schema/db.schema';
import 'dotenv/config';

const sql = postgres(process.env.POSTGRES_URL!);
const db = drizzle(sql);

export async function setupTestDatabase() {
    // Create the items table if it doesn't exist
    await sql`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            item TEXT NOT NULL
        );
    `;
}

export async function cleanupTestDatabase() {
    // Clean up test data
    await sql`DELETE FROM items`;
}
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
    throw new Error('process.env.POSTGRES_URL is undefined');
}
const connection = process.env.POSTGRES_URL;

// postgres client w prepared statements enabled
const queryClient = postgres(connection, { prepare: true });

const db = drizzle(queryClient, { schema });

// Configure query builder
export * from 'drizzle-orm';
export default db;



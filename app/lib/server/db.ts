import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';

/* if (!process.env.POSTGRES_URL) {
    throw new Error('process.env.POSTGRES_URL is undefined')
} */

// ! is a non-null assertion operator = effectively a type 
// assertion that the value isn’t null or undefined
const driver = postgres(process.env.POSTGRES_URL!);
const db = drizzle(driver);
export default db;



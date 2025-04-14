import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
            contacts JSONB,
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
    // Clean out data, keep table structure
    await sql`TRUNCATE TABLE organisations CASCADE`;
}

export function createTestOrg(overrides = {}) {
    return {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        category: 'NGO',
        name: 'Test Organisation',
        url: 'https://test.org',
        office: {
            contact: 'support',
            phone: '+31-555-0000',
            email: 'test@test.org',
            url: 'https://test.org/contact',
            postalAddress: 'Test Street',
            visitingAddress: 'Test Street'
        },
        contacts: [],
        regionOfOperations: { 'country/union/region': 'Test Region' },
        about: [],
        mainAchievements: [],
        operations: [],
        engagement: [],
        voicesAbout: [],
        ...overrides
    };
}
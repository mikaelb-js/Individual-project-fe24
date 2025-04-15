import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/server/schema';

if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable not set');
}

const sql = postgres(process.env.POSTGRES_URL);
const db = drizzle(sql);

export async function setupTestDatabase() {
    await sql`DROP TABLE IF EXISTS organisations CASCADE`;
    await sql`DROP TABLE IF EXISTS partners CASCADE`;

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

    await sql`
        CREATE TABLE partners (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organisation_id VARCHAR REFERENCES organisations(id),
            name TEXT NOT NULL,
            partner_type TEXT NOT NULL,
            category TEXT,
            description TEXT
        );
    `;

    console.log('Test database setup complete');
}

export async function cleanupTestDatabase() {
    await sql`TRUNCATE TABLE organisations CASCADE`;
    await sql`TRUNCATE TABLE partners CASCADE`;
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
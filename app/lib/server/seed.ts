import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import data from '@/data.json';
import { organisations } from '@/app/lib/server/schema/db.schema';
import { OrganisationData } from '@/app/types/organisations';

const connectionString = process.env.POSTGRES_URL!;

async function seed() {
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    console.log('Starting database seed...');

    try {
        await db.delete(organisations);

        const orgData = data as unknown as OrganisationData;

        // Seeding organisations into db happens here
        for (const [category, orgs] of Object.entries(orgData.categories)) {
            for (const [orgId, org] of Object.entries(orgs)) {
                await db.insert(organisations).values({
                    id: orgId,
                    category,
                    name: org.name,
                    url: org.url,
                    office: org.office,
                    contact: org.contact,
                    regionOfOperations: org.regionOfOperations,
                    about: org.about,
                    mainAchievements: org.mainAchievements,
                    operations: org.operations,
                    engagement: org.engagement,
                    voicesAbout: org.voicesAbout
                });
                console.log(`Inserted organisation: ${org.name}`);
            }
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

seed();
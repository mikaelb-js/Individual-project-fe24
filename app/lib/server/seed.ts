import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import * as schema from './schema';
import { organisations, partners } from './schema/db.schema';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { count } from 'drizzle-orm';
import { JsonData, Organisation, Partners } from '@/app/types/organisation';

// Database connection
const DB_CONNECTION = process.env.POSTGRES_URL!;

if (!DB_CONNECTION) {
    console.error('Error: Database connection string not found in environment');
    process.exit(1);
}

async function seedDatabase(): Promise<void> {
    console.log('Starting database seed...');

    // Load JSON data
    const dataPath = path.join(process.cwd(), 'data.json');
    const jsonData = JSON.parse(await fs.readFile(dataPath, 'utf-8')) as JsonData;

    // Connect to database
    const sql = postgres(DB_CONNECTION);
    const db = drizzle(sql, { schema });
    type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

    try {
        // tables exist?
        const tables = await sql<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
        const tableNames = tables.map(t => t.tablename);
        console.log(`Table organisations exists: ${tableNames.includes('organisations')}`);

        if (!tableNames.includes('organisations')) {
            console.error('Table "organisations" does not exist! Migration may have failed.');
            console.log('Available tables:');
            console.log(tableNames);
            process.exit(1);
        }

        // data exists?
        const existingCount = await db
            .select({ count: count() })
            .from(organisations);

        if (Number(existingCount[0].count) > 0) {
            console.log(`Database already has ${existingCount[0].count} organisations. Skipping seed.`);
            console.log('To reseed, truncate the tables first.');
            return;
        }

        console.log('Seeding organisations...');

        // hold organisation and partner records
        const organisationsData: typeof organisations.$inferInsert[] = [];
        const partnersData: typeof partners.$inferInsert[] = [];

        // Transaction around all db operations = All or nothing
        await db.transaction(async (tx) => {
            for (const category in jsonData.categories) {
                for (const key in jsonData.categories[category]) {
                    // is a partner entry?
                    if (key === 'partners') {
                        continue;
                    }

                    const orgData = jsonData.categories[category][key] as Organisation;
                    const orgId = randomUUID();

                    // type inference from schema
                    const orgRecord: typeof organisations.$inferInsert = {
                        id: orgId,
                        category: category,
                        name: orgData.name,
                        url: orgData.url || null,
                        office: orgData.office || null,
                        contacts: orgData.contacts || null,
                        regionOfOperations: orgData.regionOfOperations || null,
                        about: orgData.about || null,
                        mainAchievements: orgData.mainAchievements || null,
                        operations: orgData.operations || null,
                        engagement: orgData.engagement || null,
                        voicesAbout: orgData.voicesAbout || null
                    };

                    organisationsData.push(orgRecord);
                    await tx.insert(organisations).values(orgRecord);

                    if (orgData.partners) {
                        await processPartners(tx, orgData.partners, orgId, partnersData);
                    }
                }

                if (jsonData.categories[category].partners) {
                    for (const orgKey in jsonData.categories[category]) {
                        if (orgKey !== 'partners') {
                            const data = jsonData.categories[category][orgKey];


                            if (data) {
                                if ('name' in data) {
                                    const orgData = data as Organisation;
                                    const insertedOrg = organisationsData.find(o => o.name === orgData.name);
                                    if (insertedOrg) {
                                        await processPartners(
                                            tx,
                                            jsonData.categories[category].partners!,
                                            insertedOrg.id,
                                            partnersData
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }); // End transaction

        console.log(`Inserted ${organisationsData.length} organisations`);
        console.log(`Inserted ${partnersData.length} partners`);
        console.log('Database seeding complete!');
    } catch (error) {
        console.error('Error seeding database:', error instanceof Error ? error.message : String(error));
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
    } finally {
        await sql.end();
    }
}

async function processPartners<T extends { insert: Function }>(
    tx: T,
    partnersData: Partners,
    orgId: string,
    partnersCollection: typeof partners.$inferInsert[]
): Promise<void> {
    // Financial partners
    if (partnersData.financialPartners) {
        for (const partner of partnersData.financialPartners) {
            const partnerRecord: typeof partners.$inferInsert = {
                id: randomUUID(),
                organisationId: orgId,
                name: partner,
                partnerType: 'financialPartners',
                description: partnersData.description || null
            };
            partnersCollection.push(partnerRecord);
            await tx.insert(partners).values(partnerRecord);
        }
    }

    // Technical partners
    if (partnersData.technicalPartners) {
        for (const categoryGroup of partnersData.technicalPartners) {
            for (const partner of categoryGroup.partners) {
                const partnerRecord: typeof partners.$inferInsert = {
                    id: randomUUID(),
                    organisationId: orgId,
                    name: partner,
                    partnerType: 'technicalPartners',
                    category: categoryGroup.category || null,
                    description: partnersData.description || null
                };
                partnersCollection.push(partnerRecord);
                await tx.insert(partners).values(partnerRecord);
            }
        }
    }

    // Initiating partners
    if (partnersData.initiatingPartners) {
        for (const partner of partnersData.initiatingPartners) {
            const partnerRecord: typeof partners.$inferInsert = {
                id: randomUUID(),
                organisationId: orgId,
                name: partner,
                partnerType: 'initiatingPartners',
                description: partnersData.description || null
            };
            partnersCollection.push(partnerRecord);
            await tx.insert(partners).values(partnerRecord);
        }
    }
}

seedDatabase().catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
});
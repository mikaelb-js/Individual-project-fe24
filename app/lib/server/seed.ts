import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import '@dotenvx/dotenvx/config';
import * as schema from './schema';
import { organisations, partners } from './schema/db.schema';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { count } from 'drizzle-orm';

// Database connection
const DB_CONNECTION = process.env.POSTGRES_URL!;

if (!DB_CONNECTION) {
    console.error('Error: Database connection string not found in environment');
    process.exit(1);
}

// Proper types
interface Office {
    contact: string;
    phone: string;
    email: string;
    url: string;
    postalAddress: string;
    visitingAddress: string;
}

interface Contact {
    orgId: string;
    name: string;
    phone: string;
    email: string;
    postalAddress: string;
}

interface RegionOfOperations {
    'country/union/region': string;
}

interface ContentItem {
    title: string;
    'body-content': string;
}

interface OperationCategory {
    [category: string]: Array<{
        title: string;
        'body-content': string;
    }>;
}

interface Quote {
    quote: string;
    author: string;
}

interface PartnerGroup {
    category: string;
    partners: string[];
}

interface Partners {
    description?: string;
    financialPartners?: string[];
    technicalPartners?: PartnerGroup[];
    initiatingPartners?: string[];
}

interface Organisation {
    id?: string;
    name: string;
    url?: string;
    office?: Office;
    contacts?: Contact[];
    regionOfOperations?: RegionOfOperations;
    about?: ContentItem[];
    mainAchievements?: ContentItem[];
    operations?: OperationCategory[];
    engagement?: ContentItem[];
    voicesAbout?: Quote[];
    partners?: Partners;
}

// Alternative approach: Be explicit about what partners can be
interface CategoryData {
    partners?: Partners;
    [orgId: string]: Organisation | Partners | undefined;  // Added undefined
}

interface JsonData {
    categories: {
        [category: string]: CategoryData;
    };
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

        // Extract and transform
        const organisationsData: typeof organisations.$inferInsert[] = [];
        const partnersData: typeof partners.$inferInsert[] = [];

        // Transaction around all db operations = All or nothing
        await db.transaction(async (tx) => {
            for (const category in jsonData.categories) {
                for (const key in jsonData.categories[category]) {
                    // is a partner entry?
                    if (key === 'partners') {
                        // Handle partners at category level
                        continue;
                    }

                    // Now we know it's an organization
                    const orgData = jsonData.categories[category][key] as Organisation;
                    const orgId = randomUUID();

                    // Add organisation using type inference from schema
                    const orgRecord: typeof organisations.$inferInsert = {
                        id: orgId,
                        category: category,
                        name: orgData.name,
                        url: orgData.url || null,
                        // Use the schema's expected types directly
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

                    // Process org-level partners
                    if (orgData.partners) {
                        await processPartners(tx, orgData.partners, orgId, partnersData);
                    }
                }

                // Process any partners
                if (jsonData.categories[category].partners) {
                    for (const orgKey in jsonData.categories[category]) {
                        if (orgKey !== 'partners') {
                            const data = jsonData.categories[category][orgKey];


                            if (data) {
                                if ('name' in data) {
                                    const orgData = data as Organisation;

                                    // Find matching inserted organisation
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
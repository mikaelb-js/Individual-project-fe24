import { createServerFn } from "@tanstack/react-start";
import { Organisation, NewOrganisation, organisations, partners } from "@server/schema";
import { eq, sql, count } from 'drizzle-orm';
import db from './db';

/**
 * Fetches all organisations with optional filtering by category.
 */
export const getAllOrganisations = createServerFn({ method: 'GET' })
    .validator((category?: string) => {
        return category;
    })
    .handler(async ({ data }: { data?: string }) => {
        console.info('Fetching organisations...', data ? `Category: ${data}` : 'All');

        try {
            const results = await db.select()
                .from(organisations)
                .where(data ? eq(organisations.category, data) : undefined)
                .execute();

            const orgIds = results.map(org => org.id);
            const partnerCounts = orgIds.length > 0
                ? await db.select({
                    orgId: partners.organisationId,
                    count: sql`count(*)`.as('count')
                })
                    .from(partners)
                    .where(sql`${partners.organisationId} IN (${orgIds.join(',')})`)
                    .groupBy(partners.organisationId)
                : [];

            // Combine results
            const orgsWithCounts = results.map(org => ({
                ...org,
                partnerCount: partnerCounts.find(p => p.orgId === org.id)?.count ?? 0
            }));

            return orgsWithCounts;
        } catch (error) {
            console.error('Error getting organisations:', error);
            throw new Error('Failed to get organisations');
        }
    });

/**
 * Fetches a single organisation by ID, including all its partners.
 */
export const getOrganisation = createServerFn({ method: 'GET' })
    .validator((organisationId: string) => {
        if (typeof organisationId !== 'string' || !organisationId) {
            throw new Error('Valid organisation ID is required');
        }
        return organisationId;
    })
    .handler(async ({ data }: { data: string }) => {
        console.info(`Fetching organisation with id ${data}...`);

        try {
            const [organisation] = await db
                .select()
                .from(organisations)
                .where(eq(organisations.id, data));

            if (!organisation) {
                throw new Error('Organisation not found');
            }

            const orgPartners = await db
                .select()
                .from(partners)
                .where(eq(partners.organisationId, data));

            // default values for nullable fields
            return {
                ...organisation,
                url: organisation.url ?? '',
                office: organisation.office ?? {
                    contact: '',
                    phone: '',
                    email: '',
                    url: '',
                    postalAddress: '',
                    visitingAddress: ''
                },
                contacts: organisation.contacts ?? [],
                regionOfOperations: organisation.regionOfOperations ?? { 'country/union/region': '' },
                about: organisation.about ?? [],
                mainAchievements: organisation.mainAchievements ?? [],
                operations: Array.isArray(organisation.operations) ? organisation.operations : [],
                engagement: organisation.engagement ?? [],
                voicesAbout: organisation.voicesAbout ?? [],
                partners: orgPartners
            };
        } catch (error) {
            console.error('Error getting organisation:', error);
            throw new Error('Failed to get organisation');
        }
    });

/**
 * Creates a new organisation.
 */
export const createOrganisation = createServerFn({ method: 'POST' })
    .validator((input: NewOrganisation) => {
        if (!input) {
            throw new Error('Organisation data is required');
        }
        return input;
    })
    .handler(async ({ data }: { data: NewOrganisation }) => {
        console.info('Creating organisation...', data);
        try {
            const result = await db.insert(organisations).values(data);
            return { id: data.id };
        } catch (error) {
            console.error('Error creating organisation:', error);
            throw new Error('Failed to create organisation');
        }
    });

/**
 * Updates an existing organisation.
 */
export const updateOrganisation = createServerFn({ method: 'POST' }) // Tanstack way
    .validator((input: { id: string, data: Partial<Organisation> }) => {
        if (!input.id) {
            throw new Error('Organisation ID is required');
        }
        if (!input.data || Object.keys(input.data).length === 0) {
            throw new Error('Update data is required');
        }
        return input;
    })
    .handler(async ({ data }: { data: { id: string, data: Partial<Organisation> } }) => {
        console.info(`Updating organisation ${data.id}...`);

        try {
            await db.update(organisations)
                .set(data.data)
                .where(eq(organisations.id, data.id));

            return { success: true, id: data.id };
        } catch (error) {
            console.error('Error updating organisation:', error);
            throw new Error('Failed to update organisation');
        }
    });

/**
 * Deletes an organisation.
 */
export const deleteOrganisation = createServerFn({ method: 'POST' }) // Tanstack way
    .validator((organisationId: string) => {
        if (!organisationId) {
            throw new Error('Organisation ID is required');
        }
        return organisationId;
    })
    .handler(async ({ data }: { data: string }) => {
        console.info(`Deleting organisation ${data}...`);

        try {
            // ensure success or failure for both
            await db.transaction(async (tx) => {
                await tx.delete(partners)
                    .where(eq(partners.organisationId, data));
                await tx.delete(organisations)
                    .where(eq(organisations.id, data));
            });

            return { success: true, id: data };
        } catch (error) {
            console.error('Error deleting organisation:', error);
            throw new Error('Failed to delete organisation');
        }
    });



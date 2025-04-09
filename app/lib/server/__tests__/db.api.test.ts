import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import db from '../db';
import { organisations } from '../schema/db.schema';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, cleanupTestDatabase } from './setup';

describe('Database operations tests', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterEach(async () => {
        await cleanupTestDatabase();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    it('fails gracefully when trying to read non-existent record', async () => {
        const result = await db.select().from(organisations).where(eq(organisations.id, 'non-existent-id'));
        expect(result).toHaveLength(0);
    });

    it('can handle multiple organisations', async () => {
        const org1 = {
            id: 'test-org-1',
            category: 'NGO',
            name: 'Test Org 1',
            url: 'https://test1.org',
            office: {
                contact: 'support1',
                phone: '+31-555-0001',
                email: 'test1@test.org',
                url: 'https://test1.org/contact',
                postalAddress: 'Test Street 1',
                visitingAddress: 'Test Street 1'
            },
            contact: [],
            regionOfOperations: {
                areas: ['Region 1'],
                description: 'Test area 1'
            }
        };

        const org2 = {
            id: 'test-org-2',
            category: 'Company',
            name: 'Test Org 2',
            url: 'https://test2.org',
            office: {
                contact: 'support2',
                phone: '+31-555-0002',
                email: 'test2@test.org',
                url: 'https://test2.org/contact',
                postalAddress: 'Test Street 2',
                visitingAddress: 'Test Street 2'
            },
            contact: [],
            regionOfOperations: {
                areas: ['Region 2'],
                description: 'Test area 2'
            }
        };

        await db.insert(organisations).values([org1, org2]);

        const results = await db.select().from(organisations);
        expect(results).toHaveLength(2);

        await db.delete(organisations).where(eq(organisations.id, org1.id));
        await db.delete(organisations).where(eq(organisations.id, org2.id));
    });

    it('can perform CRUD operations', async () => {
        //expect this
        const testOrg = {
            id: 'test-org-crud',
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
            contact: [],
            regionOfOperations: {
                areas: ['Test Region'],
                description: 'Test area'
            }
        };

        //test Create 
        await db.insert(organisations).values(testOrg);
        const readResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));
        expect(readResult[0]).toMatchObject(testOrg);

        // test Update
        const updatedName = 'Updated Test Organisation';
        await db.update(organisations)
            .set({ name: updatedName })
            .where(eq(organisations.id, testOrg.id));

        const updateResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));
        expect(updateResult[0].name).toBe(updatedName);

        // test Delete
        await db.delete(organisations).where(eq(organisations.id, testOrg.id));
        const deleteResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));
        expect(deleteResult).toHaveLength(0);
    });
});
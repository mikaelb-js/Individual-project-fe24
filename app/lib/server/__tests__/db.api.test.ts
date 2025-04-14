import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import db from '../db';
import { organisations } from '../schema/db.schema';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, cleanupTestDatabase, createTestOrg } from '../../../utilities/db.setup.helper';

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

    it('fails gracefully with non-existent record', async () => {
        const result = await db.select().from(organisations).where(eq(organisations.id, 'non-existent-id'));
        expect(result).toHaveLength(0);
    });

    it('handles multiple organisations', async () => {
        const org1 = createTestOrg({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
            regionOfOperations: { 'country/union/region': 'Region 1' }
        });

        const org2 = createTestOrg({
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            category: 'Company',
            name: 'Test Org 2',
            regionOfOperations: { 'country/union/region': 'Region 2' }
        });

        await db.insert(organisations).values([org1, org2]);

        const results = await db.select().from(organisations);
        expect(results).toHaveLength(2);

        await db.delete(organisations).where(eq(organisations.id, org1.id));
        await db.delete(organisations).where(eq(organisations.id, org2.id));
    });

    it('performs CRUD operations', async () => {
        const testOrg = createTestOrg();

        // Create & Read
        await db.insert(organisations).values(testOrg);
        const readResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));

        expect(readResult[0].id).toBe(testOrg.id);
        expect(readResult[0].name).toBe(testOrg.name);
        expect(readResult[0].category).toBe(testOrg.category);

        // Update
        const updatedName = 'Updated Test Organisation';
        await db.update(organisations)
            .set({ name: updatedName })
            .where(eq(organisations.id, testOrg.id));

        const updateResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));
        expect(updateResult[0].name).toBe(updatedName);

        // Delete
        await db.delete(organisations).where(eq(organisations.id, testOrg.id));
        const deleteResult = await db.select().from(organisations).where(eq(organisations.id, testOrg.id));
        expect(deleteResult).toHaveLength(0);
    });
});
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import db from '../db';
import { items } from '../schema/db.schema';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, cleanupTestDatabase } from './setup';

describe('Database smoke test', () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    it('connects to database and does CRUD', async () => {
        const testItem = {
            id: 't-id-12',
            item: 'test-item'
        };

        // Create
        await db.insert(items).values(testItem);

        // Read
        const readResult = await db.select().from(items).where(eq(items.id, testItem.id));
        expect(readResult[0]).toEqual(testItem);

        // Update
        const updatedValue = 'updated-test-item';
        await db.update(items)
            .set({ item: updatedValue })
            .where(eq(items.id, testItem.id));

        const updateResult = await db.select().from(items).where(eq(items.id, testItem.id));
        expect(updateResult[0].item).toBe(updatedValue);

        // Delete
        await db.delete(items).where(eq(items.id, testItem.id));
        const deleteResult = await db.select().from(items).where(eq(items.id, testItem.id));
        expect(deleteResult).toHaveLength(0);
    });
});
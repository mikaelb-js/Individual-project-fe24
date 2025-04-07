import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
    // items table holding generated id and 1 item string field
    id: text('id').primaryKey(),
    item: text('item').notNull(),
});


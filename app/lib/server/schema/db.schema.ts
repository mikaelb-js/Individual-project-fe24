import { pgTable, text, uuid, jsonb, varchar } from 'drizzle-orm/pg-core';

export const organisations = pgTable('organisations', {
    id: varchar('id').primaryKey(),
    category: text('category').notNull(),
    name: text('name').notNull(),
    url: text('url'),
    office: jsonb('office').$type<{
        contact: string;
        phone: string;
        email: string;
        url: string;
        postalAddress: string;
        visitingAddress: string;
    }>(),
    contact: jsonb('contact').$type<Array<{
        name: string;
        phone: string;
        email: string;
        postalAddress: string;
    }>>(),
    regionOfOperations: jsonb('region_of_operations').$type<{
        areas: string[];
        description: string;
    }>(),
    about: jsonb('about').$type<Array<{
        title: string;
        'body-content': string;
    }>>(),
    mainAchievements: jsonb('main_achievements').$type<Array<{
        title: string;
        'body-content': string;
    }>>(),
    operations: jsonb('operations'),
    engagement: jsonb('engagement').$type<Array<{
        title: string;
        'body-content': string;
    }>>(),
    voicesAbout: jsonb('voices_about').$type<Array<{
        quote: string;
        author: string;
    }>>()
});

export const partners = pgTable('partners', {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: varchar('organisation_id').references(() => organisations.id),
    name: text('name').notNull(),
    partnerType: text('partner_type').notNull().$type<'financialPartners' | 'technicalPartners' | 'initiatingPartners'>(),
    category: text('category'),
    description: text('description')
});
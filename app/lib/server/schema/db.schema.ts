import { pgTable, text, uuid, jsonb, varchar } from 'drizzle-orm/pg-core';

/* 
I want to have database schema in my TypeScript codebase, I don’t wanna deal with SQL migration files.
I want Drizzle to “push” my schema directly to the database

That’s a codebase first approach. You have your TypeScript Drizzle schema as a source of truth and Drizzle let’s you push schema changes to the database using drizzle-kit push command.
*/
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
    // Match JSON field name (plural)
    contacts: jsonb('contacts').$type<Array<{
        orgId: string;
        name: string;
        phone: string;
        email: string;
        postalAddress: string;
    }>>(),
    regionOfOperations: jsonb('region_of_operations').$type<{
        'country/union/region': string;
    }>(),
    about: jsonb('about').$type<Array<{
        title: string;
        'body-content': string;
    }>>(),
    mainAchievements: jsonb('main_achievements').$type<Array<{
        title: string;
        'body-content': string;
    }>>(),
    // Structure to match your complex operations data
    operations: jsonb('operations').$type<Array<{
        [categoryName: string]: Array<{
            title: string;
            'body-content': string;
        }>;
    }>>(),
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
    organizasionId: varchar('organisation_id').references(() => organisations.id),
    name: text('name').notNull(),
    partnerType: text('partner_type').notNull().$type<'financialPartners' | 'technicalPartners' | 'initiatingPartners'>(),
    category: text('category'),
    description: text('description')
});
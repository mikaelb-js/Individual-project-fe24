export interface Office {
    contact: string;
    phone: string;
    email: string;
    url: string;
    postalAddress: string;
    visitingAddress: string;
}

export interface Contact {
    name: string;
    phone: string;
    email: string;
    postalAddress: string;
}

export interface RegionOfOperations {
    areas: string[];
    description: string;
}

export interface ContentSection {
    title: string;
    'body-content': string;
}

export interface Voice {
    quote: string;
    author: string;
}

export interface Organisation {
    name: string;
    url: string;
    office: Office;
    contact: Contact[];
    regionOfOperations: RegionOfOperations;
    about: ContentSection[];
    mainAchievements: ContentSection[];
    operations: ContentSection[];
    engagement: ContentSection[];
    voicesAbout: Voice[];
}

export interface OrganisationData {
    categories: {
        [category: string]: {
            [orgId: string]: Organisation;
        };
    };
}
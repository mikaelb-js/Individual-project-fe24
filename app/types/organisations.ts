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
export interface Partners {
    description?: string;
    financialPartners?: string[];
    technicalPartners?: PartnerGroup[];
    initiatingPartners?: string[];
}
export interface Organisation {
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
interface CategoryData {
    partners?: Partners;
    [orgId: string]: Organisation | Partners | undefined;
}
export interface JsonData {
    categories: {
        [category: string]: CategoryData;
    };
}

export interface SeedData {
    categories: {
        name: string;
        items: {
            name: string;
            subcategory?: string;
            common_variants?: string[];
        }[];
    }[];
} 
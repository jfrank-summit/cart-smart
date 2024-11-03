export type Item = {
    id: string;
    name: string;
    categoryId: string;
    subcategory?: string;
    variants?: string[];
    isChecked?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type List = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    items: Item[];
};

export type Category = {
    id: string;
    name: string;
    items?: Item[];
};

// API Response types
export type ApiResponse<T> = {
    data: T;
    error?: never;
} | {
    data?: never;
    error: string;
};

// Function types for API calls using fp-ts
export type GetLists = () => Promise<ApiResponse<List[]>>;
export type CreateList = (name: string) => Promise<ApiResponse<List>>;
export type AddItem = (listId: number, item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Item>>; 
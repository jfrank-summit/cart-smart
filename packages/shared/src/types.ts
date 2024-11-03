export type Item = {
    id: number;
    name: string;
    category: string;
    is_checked: boolean;
    created_at: string;
    updated_at: string;
};

export type List = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    items: Item[];
};

export type Category = {
    id: number;
    name: string;
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
export type AddItem = (listId: number, item: Omit<Item, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResponse<Item>>; 
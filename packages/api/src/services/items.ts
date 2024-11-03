import { getDatabase } from '../db';
import { createDatabaseError, createNotFoundError, createForbiddenError } from '../utils/errors';

export interface CreateItemDTO {
    listId: number;
    name: string;
    categoryId: number;
    createdBy: number;
    isChecked?: boolean;
}

export interface UpdateItemDTO {
    name?: string;
    categoryId?: number;
    isChecked?: boolean;
}

export const createItem = async (data: CreateItemDTO) => {
    try {
        const db = await getDatabase();

        // Check if user has access to the list
        const list = await db.get(`
            SELECT l.* FROM lists l
            LEFT JOIN list_shares ls ON l.id = ls.list_id
            WHERE l.id = ? AND (l.owner_id = ? OR ls.user_id = ?)
        `, [data.listId, data.createdBy, data.createdBy]);

        if (!list) {
            throw createForbiddenError('No access to this list');
        }

        const result = await db.run(
            `INSERT INTO items (
                list_id, name, category_id, is_checked, created_by
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                data.listId,
                data.name,
                data.categoryId,
                data.isChecked ? 1 : 0,
                data.createdBy
            ]
        );

        return await db.get(
            'SELECT * FROM items WHERE id = ?',
            result.lastID
        );
    } catch (error: any) {
        if (error.name === 'ForbiddenError') throw error;
        throw createDatabaseError('Failed to create item');
    }
};

export const toggleItemCheck = async (id: number, userId: number) => {
    try {
        const db = await getDatabase();

        // Check if user has access to the item's list
        const item = await db.get(`
            SELECT i.* FROM items i
            JOIN lists l ON i.list_id = l.id
            LEFT JOIN list_shares ls ON l.id = ls.list_id
            WHERE i.id = ? AND (l.owner_id = ? OR ls.user_id = ?)
        `, [id, userId, userId]);

        if (!item) {
            throw createNotFoundError('Item not found or no access');
        }

        await db.run(`
            UPDATE items 
            SET is_checked = ((is_checked + 1) % 2),
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, id);

        return await db.get('SELECT * FROM items WHERE id = ?', id);
    } catch (error: any) {
        if (error.name === 'NotFoundError') throw error;
        throw createDatabaseError('Failed to toggle item');
    }
};

export const deleteItem = async (id: number, userId: number) => {
    try {
        const db = await getDatabase();

        // Check if user has access to delete the item
        const item = await db.get(`
            SELECT i.* FROM items i
            JOIN lists l ON i.list_id = l.id
            LEFT JOIN list_shares ls ON l.id = ls.list_id
            WHERE i.id = ? AND (l.owner_id = ? OR (ls.user_id = ? AND ls.can_edit = 1))
        `, [id, userId, userId]);

        if (!item) {
            throw createNotFoundError('Item not found or no access');
        }

        await db.run('DELETE FROM items WHERE id = ?', id);
    } catch (error: any) {
        if (error.name === 'NotFoundError') throw error;
        throw createDatabaseError('Failed to delete item');
    }
};
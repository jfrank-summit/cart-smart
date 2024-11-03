import { getDatabase } from '../db';
import { createDatabaseError, createNotFoundError } from '../utils/errors';

export interface CreateListDTO {
    name: string;
    ownerId: number;
    isPublic?: boolean;
}

export interface UpdateListDTO {
    name?: string;
    isPublic?: boolean;
}

export const getLists = async (userId: number) => {
    try {
        const db = await getDatabase();
        return await db.all(`
            SELECT 
                l.*,
                json_group_array(
                    json_object(
                        'id', i.id,
                        'name', i.name,
                        'category_id', i.category_id,
                        'is_checked', i.is_checked,
                        'created_by', i.created_by,
                        'created_at', i.created_at,
                        'updated_at', i.updated_at
                    )
                ) as items
            FROM lists l
            LEFT JOIN list_shares ls ON l.id = ls.list_id
            LEFT JOIN items i ON l.id = i.list_id
            WHERE l.owner_id = ? OR ls.user_id = ?
            GROUP BY l.id
            ORDER BY l.created_at DESC
        `, [userId, userId]);
    } catch (error) {
        throw createDatabaseError('Failed to fetch lists');
    }
};

export const createList = async (data: CreateListDTO) => {
    try {
        const db = await getDatabase();
        const result = await db.run(
            'INSERT INTO lists (name, owner_id, is_public) VALUES (?, ?, ?)',
            [data.name, data.ownerId, data.isPublic ?? false]
        );

        return await db.get('SELECT * FROM lists WHERE id = ?', result.lastID);
    } catch (error) {
        throw createDatabaseError('Failed to create list');
    }
};

export const updateList = async (id: number, userId: number, data: UpdateListDTO) => {
    try {
        const db = await getDatabase();

        // Check if user has permission to update
        const list = await db.get(`
            SELECT l.* FROM lists l
            LEFT JOIN list_shares ls ON l.id = ls.list_id
            WHERE l.id = ? AND (l.owner_id = ? OR (ls.user_id = ? AND ls.can_edit = 1))
        `, [id, userId, userId]);

        if (!list) {
            throw createNotFoundError('List not found or permission denied');
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.isPublic !== undefined) {
            updates.push('is_public = ?');
            values.push(data.isPublic);
        }

        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            await db.run(
                `UPDATE lists SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        return await db.get('SELECT * FROM lists WHERE id = ?', id);
    } catch (error: any) {
        if (error.name === 'NotFoundError') throw error;
        throw createDatabaseError('Failed to update list');
    }
}; 
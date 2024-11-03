import { Router } from 'express';
import { z } from 'zod';
import { createItem, toggleItemCheck, deleteItem } from '../services/items';
import { isAppError } from '../utils/errors';

const router = Router();

// Schema for item creation
const createItemSchema = z.object({
    list_id: z.number().int().positive(),
    name: z.string().min(1).max(255),
    category_id: z.number().int().positive(),
    is_checked: z.boolean().optional()
});

// Add item to list
router.post('/', async (req, res) => {
    try {
        const data = createItemSchema.parse(req.body);
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development

        const item = await createItem({
            listId: data.list_id,
            name: data.name,
            categoryId: data.category_id,
            createdBy: userId,
            isChecked: data.is_checked
        });

        res.status(201).json({ data: item });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Toggle item check status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development

        const item = await toggleItemCheck(Number(id), userId);
        res.json({ data: item });
    } catch (error) {
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to toggle item' });
    }
});

// Delete item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development

        await deleteItem(Number(id), userId);
        res.status(204).send();
    } catch (error) {
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router; 
import { Router } from 'express';
import { z } from 'zod';
import { getDatabase, getCategories, getSharedItems, searchSharedItems } from '../db';
import { isAppError } from '../utils/errors';

const router = Router();

// Get all categories
router.get('/categories', async (_req, res) => {
    try {
        const db = await getDatabase();
        const categories = await getCategories(db);
        res.json({ data: categories });
    } catch (error) {
        console.error('Failed to get categories:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get shared items, optionally filtered by category
router.get('/items', async (req, res) => {
    try {
        const db = await getDatabase();
        const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
        const searchTerm = req.query.search as string | undefined;

        let items;
        if (searchTerm) {
            items = await searchSharedItems(db, searchTerm);
        } else {
            items = await getSharedItems(db, categoryId);
        }

        res.json({ data: items });
    } catch (error) {
        console.error('Failed to get shared items:', error);
        res.status(500).json({ error: 'Failed to get shared items' });
    }
});

export default router; 
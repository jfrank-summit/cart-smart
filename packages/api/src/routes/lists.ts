import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getLists, createList, updateList } from '../services/lists';
import { isAppError } from '../utils/errors';

const router = Router();

const listSchema = z.object({
    name: z.string().min(1).max(255)
});

const getListsHandler = async (_req: Request, res: Response) => {
    try {
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development
        const lists = await getLists(userId);
        res.json({ data: lists });
    } catch (error) {
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
};

const createListHandler = async (req: Request, res: Response) => {
    try {
        const { name } = listSchema.parse(req.body);
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development

        const list = await createList({
            name,
            ownerId: userId,
            isPublic: false
        });

        res.status(201).json({ data: list });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to create list' });
    }
};

const updateListHandler = async (req: Request, res: Response) => {
    try {
        const { name } = listSchema.parse(req.body);
        const { id } = req.params;
        // TODO: Get actual user ID from auth middleware
        const userId = 1; // Temporary for development

        const list = await updateList(Number(id), userId, { name });
        res.json({ data: list });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to update list' });
    }
};

router.get('/', getListsHandler);
router.post('/', createListHandler);
router.put('/:id', updateListHandler);

export default router; 
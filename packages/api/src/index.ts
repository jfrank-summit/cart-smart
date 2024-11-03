import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import listsRouter from './routes/lists.js';
import itemsRouter from './routes/items.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and seed data
Promise.all([
    initializeDatabase(),
    seedDatabase()
])
    .then(() => {
        console.log('Database initialized and seeded');
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

// Routes
app.use('/api/lists', listsRouter);
app.use('/api/items', itemsRouter);

// Basic health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase()
    .then(() => {
        console.log('Database initialized');
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

// Basic health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';
import seedData from './seed-data.json';

let db: Database | null = null;

const createSchema = async (database: Database) => {
    await database.exec(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Lists table with user ownership
        CREATE TABLE IF NOT EXISTS lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            is_public BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- List sharing table (for collaborative lists)
        CREATE TABLE IF NOT EXISTS list_shares (
            list_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            can_edit BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (list_id, user_id),
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Items table with category relationship
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category_id INTEGER,
            is_checked INTEGER DEFAULT 0,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Shared items table (for items that can be reused across lists)
        CREATE TABLE IF NOT EXISTS shared_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            category_id INTEGER,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
};

const insertCategory = async (database: Database, name: string) => {
    try {
        await database.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', name);
        const result = await database.get('SELECT id FROM categories WHERE name = ?', name);
        if (!result) {
            throw new Error(`Failed to get category ID for ${name}`);
        }
        return result.id;
    } catch (error) {
        console.error('Error inserting category:', name, error);
        throw error;
    }
};

const insertSharedItem = async (database: Database, name: string, categoryId: number) => {
    try {
        const result = await database.run(
            'INSERT OR IGNORE INTO shared_items (name, category_id, created_by) VALUES (?, ?, ?)',
            [name, categoryId, 1]
        );
        if (result.changes === 0) {
            console.log(`Item ${name} already exists, skipping`);
        }
        return result;
    } catch (error) {
        console.error('Error inserting shared item:', name, error);
        throw error;
    }
};

const createSystemUser = async (database: Database) => {
    try {
        await database.run(
            'INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)',
            [1, 'system@example.com', 'System']
        );
        // Verify the user was created
        const user = await database.get('SELECT id FROM users WHERE id = 1');
        if (!user) {
            throw new Error('Failed to create system user');
        }
    } catch (error) {
        console.error('Error creating system user:', error);
        throw error;
    }
};

const insertSeedData = async (database: Database) => {
    try {
        // Create system user first and wait for it to complete
        await createSystemUser(database);

        // Insert categories sequentially to avoid race conditions
        for (const category of seedData.categories) {
            const categoryId = await insertCategory(database, category.name);

            // Insert items for this category sequentially
            for (const item of category.items) {
                await insertSharedItem(database, item.name, categoryId);
            }
        }
    } catch (error) {
        console.error('Error in insertSeedData:', error);
        throw error;
    }
};

export const initializeDatabase = async () => {
    if (db) return db;

    const dbDir = path.join(__dirname, '..', '..', 'data');
    await fs.mkdir(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, 'grocery.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.run('PRAGMA foreign_keys = ON');
    await createSchema(db);
    await insertSeedData(db);

    return db;
};

export const getDatabase = async () => {
    if (!db) {
        db = await initializeDatabase();
    }
    return db;
};

export const getCategories = async (database: Database) => {
    return database.all('SELECT * FROM categories ORDER BY name');
};

export const getSharedItems = async (database: Database, categoryId?: number) => {
    const query = `
        SELECT 
            si.id,
            si.name,
            si.category_id,
            c.name as category_name
        FROM shared_items si
        LEFT JOIN categories c ON si.category_id = c.id
        ${categoryId ? 'WHERE si.category_id = ?' : ''}
        ORDER BY si.name
    `;

    return categoryId
        ? database.all(query, categoryId)
        : database.all(query);
};

export const searchSharedItems = async (database: Database, searchTerm: string) => {
    const query = `
        SELECT 
            si.id,
            si.name,
            si.category_id,
            c.name as category_name
        FROM shared_items si
        LEFT JOIN categories c ON si.category_id = c.id
        WHERE si.name LIKE ?
        ORDER BY si.name
    `;

    return database.all(query, `%${searchTerm}%`);
}; 
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase() {
    if (db) return db;

    const dbDir = path.join(__dirname, '..', '..', 'data');
    await fs.mkdir(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, 'grocery.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.run('PRAGMA foreign_keys = ON');

    await db.exec(`
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
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        );

        -- Items table with category relationship
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category_id TEXT NOT NULL,
            subcategory TEXT,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );

        -- Item variants table
        CREATE TABLE IF NOT EXISTS item_variants (
            item_id TEXT NOT NULL,
            variant TEXT NOT NULL,
            PRIMARY KEY (item_id, variant),
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
        );

        -- List items table (keep existing structure)
        CREATE TABLE IF NOT EXISTS list_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            item_id TEXT NOT NULL,
            is_checked INTEGER DEFAULT 0,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
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

    // Insert default categories
    await db.run(`
        INSERT OR IGNORE INTO categories (name) 
        VALUES 
            ('Produce'),
            ('Dairy'),
            ('Meat'),
            ('Pantry'),
            ('Frozen'),
            ('Beverages'),
            ('Household'),
            ('Other')
    `);

    return db;
}

export async function getDatabase() {
    if (!db) {
        db = await initializeDatabase();
    }
    return db;
} 
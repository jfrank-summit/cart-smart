import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase() {
    if (db) return db;

    // Ensure the data directory exists
    const dbDir = path.join(__dirname, '..', '..', 'data');
    await fs.mkdir(dbDir, { recursive: true });

    const dbPath = path.join(dbDir, 'grocery.sqlite');

    // Open database connection
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');

    // Create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            is_checked INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
    `);

    // Insert default categories if they don't exist
    await db.run(`
        INSERT OR IGNORE INTO categories (name) 
        VALUES ('Produce'), ('Dairy'), ('Meat'), ('Pantry'), 
               ('Frozen'), ('Beverages'), ('Household'), ('Other')
    `);

    return db;
}

export async function getDatabase() {
    if (!db) {
        db = await initializeDatabase();
    }
    return db;
} 
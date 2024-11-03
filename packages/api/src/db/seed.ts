import { getDatabase } from './index';
import seedData from './seed-data.json';
import crypto from 'crypto';

// Helper function to generate random IDs
function generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function seedDatabase() {
    const db = await getDatabase();

    try {
        await db.run('BEGIN TRANSACTION');

        // Insert categories
        for (const category of seedData.categories) {
            const categoryId = generateId('cat');
            await db.run(
                'INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)',
                [categoryId, category.name]
            );

            // Insert items for this category
            for (const item of category.items) {
                const itemId = generateId('item');
                await db.run(
                    'INSERT OR IGNORE INTO items (id, name, category_id, subcategory) VALUES (?, ?, ?, ?)',
                    [itemId, item.name, categoryId, 'subcategory' in item ? item.subcategory : null]
                );

                // Insert variants if they exist
                if ('common_variants' in item && item.common_variants) {
                    for (const variant of item.common_variants) {
                        await db.run(
                            'INSERT OR IGNORE INTO item_variants (item_id, variant) VALUES (?, ?)',
                            [itemId, variant]
                        );
                    }
                }
            }
        }

        await db.run('COMMIT');
        console.log('Database seeded successfully');
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error seeding database:', error);
        throw error;
    }
} 
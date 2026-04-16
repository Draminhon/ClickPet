import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function syncAll() {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`Connected to: ${conn.connection.name}`);

        const db = conn.connection.db;
        const usersCol = db.collection('users');
        const productsCol = db.collection('products');
        const reviewsCol = db.collection('reviews');

        // 1. Sync Partners (Users)
        const partners = await usersCol.find({ role: { $in: ['partner', 'veterinarian'] } }).toArray();
        console.log(`\nChecking ${partners.length} partners...`);

        for (const partner of partners) {
            const reviews = await reviewsCol.find({ partnerId: partner._id }).toArray();
            const count = reviews.length;
            let avgRating = 0;

            if (count > 0) {
                const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
                avgRating = Math.round((sum / count) * 10) / 10;
            }

            console.log(`Partner: ${partner.name} (${partner._id})`);
            console.log(`  Reviews found: ${count}, New Rating: ${avgRating}`);

            await usersCol.updateOne(
                { _id: partner._id },
                { $set: { rating: avgRating, reviewCount: count } }
            );
        }

        // 2. Sync Products
        const products = await productsCol.find({}).toArray();
        console.log(`\nChecking ${products.length} products...`);

        for (const product of products) {
            const reviews = await reviewsCol.find({ productId: product._id }).toArray();
            const count = reviews.length;
            let avgRating = 0;

            if (count > 0) {
                const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
                avgRating = Math.round((sum / count) * 10) / 10;
            }

            if (product.rating !== avgRating || product.reviewCount !== count) {
                console.log(`Product: ${product.title} (${product._id})`);
                console.log(`  Mismatch! DB has ${product.rating}/${product.reviewCount}, should be ${avgRating}/${count}`);
                
                await productsCol.updateOne(
                    { _id: product._id },
                    { $set: { rating: avgRating, reviewCount: count } }
                );
                console.log(`  Updated.`);
            }
        }

        console.log('\nFinal synchronization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during sync:', error);
        process.exit(1);
    }
}

syncAll();

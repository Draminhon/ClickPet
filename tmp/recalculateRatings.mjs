import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickpet';

async function recalculate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Define schemas briefly to avoid importing complex models with dependencies
        const Review = mongoose.model('Review', new mongoose.Schema({
            partnerId: mongoose.Schema.Types.ObjectId,
            productId: mongoose.Schema.Types.ObjectId,
            rating: Number
        }));

        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            role: String,
            rating: Number,
            reviewCount: Number
        }));

        const Product = mongoose.model('Product', new mongoose.Schema({
            title: String,
            rating: Number,
            reviewCount: Number
        }));

        // 1. Recalculate Partners (Users)
        const partners = await User.find({ role: { $in: ['partner', 'veterinarian'] } });
        console.log(`\n--- Recalculating ${partners.length} partners/vets ---`);

        for (const partner of partners) {
            const reviews = await Review.find({ partnerId: partner._id });
            
            let avgRating = 0;
            let count = reviews.length;

            if (count > 0) {
                const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
                avgRating = Math.round((sum / count) * 10) / 10;
            }

            console.log(`Partner: ${partner.name} (${partner._id})`);
            console.log(`  Reviews found: ${count}, Rating: ${avgRating}`);

            await User.findByIdAndUpdate(partner._id, {
                rating: avgRating,
                reviewCount: count
            });
        }

        // 2. Recalculate Products
        const products = await Product.find({});
        console.log(`\n--- Recalculating ${products.length} products ---`);

        for (const product of products) {
            const reviews = await Review.find({ productId: product._id });
            
            let avgRating = 0;
            let count = reviews.length;

            if (count > 0) {
                const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
                avgRating = Math.round((sum / count) * 10) / 10;
            }

            console.log(`Product: ${product.title} (${product._id})`);
            console.log(`  Reviews found: ${count}, Rating: ${avgRating}`);

            await Product.findByIdAndUpdate(product._id, {
                rating: avgRating,
                reviewCount: count
            });
        }

        console.log('\nDone!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

recalculate();

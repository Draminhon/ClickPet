import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkReviews() {
    await mongoose.connect(MONGODB_URI);
    const Review = mongoose.model('Review', new mongoose.Schema({}, { strict: false }));
    const count = await Review.countDocuments({});
    console.log(`Total reviews in DB: ${count}`);
    const all = await Review.find({});
    console.log(JSON.stringify(all, null, 2));
    process.exit(0);
}

checkReviews();

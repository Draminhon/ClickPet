import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
    await mongoose.connect(MONGODB_URI);
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const product = await Product.findById('69de76900802a41473931bdf');
    console.log(JSON.stringify(product, null, 2));
    process.exit(0);
}

check();

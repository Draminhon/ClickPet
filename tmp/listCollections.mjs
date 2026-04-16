import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listCollections() {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));
    process.exit(0);
}

listCollections();

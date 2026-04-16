import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function forceUpdate() {
    await mongoose.connect(MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const partnerId = '69de758a0802a41473931b25';
    console.log(`Updating partner ${partnerId}...`);
    
    const result = await User.updateOne(
        { _id: new mongoose.Types.ObjectId(partnerId) },
        { $set: { rating: 0, reviewCount: 0 } }
    );
    
    console.log('Update Result:', result);
    
    const updated = await User.findById(partnerId);
    console.log('Document after update:', JSON.stringify(updated, null, 2));
    
    process.exit(0);
}

forceUpdate();

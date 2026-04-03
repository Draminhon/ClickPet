import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickpet';

async function deleteOrphans() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        
        const User = mongoose.connection.db.collection('users');
        const Subscription = mongoose.connection.db.collection('subscriptions');
        
        const subs = await Subscription.find({}).toArray();
        let deletedCount = 0;
        
        console.log(`Checking ${subs.length} subscriptions...`);
        
        for (const sub of subs) {
            let isOrphan = false;
            
            if (!sub.partnerId) {
                isOrphan = true;
            } else {
                let pId;
                try {
                    pId = typeof sub.partnerId === 'string' ? new mongoose.Types.ObjectId(sub.partnerId) : sub.partnerId;
                    const user = await User.findOne({ _id: pId });
                    if (!user) isOrphan = true;
                } catch (e) {
                    isOrphan = true;
                }
            }
            
            if (isOrphan) {
                console.log(`Deleting Orphan Sub: ${sub._id} (Partner: ${sub.partnerId || 'MISSING'})`);
                await Subscription.deleteOne({ _id: sub._id });
                deletedCount++;
            }
        }
        
        console.log('------------------------------------');
        console.log(`Cleanup complete!`);
        console.log(`Total orphans deleted: ${deletedCount}`);
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
    }
}

deleteOrphans();

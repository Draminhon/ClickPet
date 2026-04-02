import mongoose from 'mongoose';
import fs from 'fs';

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function checkSub() {
    await mongoose.connect(MONGODB_URI);
    const collection = mongoose.connection.db.collection('subscriptions');
    const sub = await collection.findOne({ plan: { $ne: 'free' } }, { sort: { updatedAt: -1 } });
    fs.writeFileSync('tmp/sub.json', JSON.stringify(sub, null, 2));
    mongoose.disconnect();
}

checkSub().catch(console.error);

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function checkSubs() {
    await mongoose.connect(MONGODB_URI);
    const collection = mongoose.connection.db.collection('subscriptions');
    const subs = await collection.find({}).toArray();
    
    const partnerCounts = {};
    for (const sub of subs) {
        const pId = sub.partnerId?.toString() || 'unknown';
        if (!partnerCounts[pId]) partnerCounts[pId] = [];
        partnerCounts[pId].push({ id: sub._id, plan: sub.plan, createdAt: sub.createdAt });
    }
    
    for (const [pId, list] of Object.entries(partnerCounts)) {
        if (list.length > 1) {
            console.log(`Partner ${pId} has ${list.length} subscriptions`);
            console.log(list);
        }
    }
    
    console.log(`Total subscriptions: ${subs.length}`);
    mongoose.disconnect();
}

checkSubs().catch(console.error);

import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function checkOrphans() {
    await mongoose.connect(MONGODB_URI);
    
    // Bypass schemas
    const User = mongoose.connection.db.collection('users');
    const Subscription = mongoose.connection.db.collection('subscriptions');
    
    const subs = await Subscription.find({}).toArray();
    let orphans = 0;
    
    for (const sub of subs) {
        if (!sub.partnerId) {
            orphans++;
            continue;
        }
        
        let pId;
        try {
            pId = new mongoose.Types.ObjectId(sub.partnerId.toString());
        } catch (e) {
            pId = sub.partnerId;
        }
        
        const user = await User.findOne({ _id: pId });
        if (!user) {
            orphans++;
            console.log(`Orphan Sub: ${sub._id} - Partner: ${sub.partnerId} - Plan: ${sub.plan}`);
        }
    }
    
    console.log(`Total subscriptions: ${subs.length}`);
    console.log(`Total orphans: ${orphans}`);
    
    mongoose.disconnect();
}

checkOrphans().catch(console.error);

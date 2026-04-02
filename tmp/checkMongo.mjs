import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function checkSub() {
    await mongoose.connect(MONGODB_URI);
    
    const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', new mongoose.Schema({}, { strict: false }));
    const sub = await Subscription.findOne().sort({ createdAt: -1 }).lean();
    
    console.log(JSON.stringify(sub, null, 2));
    mongoose.disconnect();
}

checkSub().catch(console.error);

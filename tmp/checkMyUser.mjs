import mongoose from 'mongoose';
import fs from 'fs';

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function checkSub() {
    await mongoose.connect(MONGODB_URI);
    const collection = mongoose.connection.db.collection('users');
    const user = await collection.findOne({}, { sort: { createdAt: -1 } });
    fs.writeFileSync('tmp/user.json', JSON.stringify(user, null, 2));
    mongoose.disconnect();
}

checkSub().catch(console.error);

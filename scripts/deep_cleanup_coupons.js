const mongoose = require('mongoose');

async function deepCleanup() {
    const uri = 'mongodb://localhost:27017/clickpet';
    console.log('Connecting to:', uri);
    
    try {
        await mongoose.connect(uri);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const collection = db.collection('coupons');
        
        console.log('--- Dropping ALL indexes except _id ---');
        try {
            await collection.dropIndexes();
            console.log('Successfully dropped all indexes.');
        } catch (e) {
            console.log('No indexes to drop or collection doesn\'t exist.');
        }
        
        console.log('--- Creating NEW compound index explicitly ---');
        await collection.createIndex({ code: 1, partnerId: 1 }, { unique: true });
        console.log('Compound unique index created.');
        
        await collection.createIndex({ partnerId: 1 });
        console.log('Secondary partnerId index created.');

        console.log('--- Final Index List ---');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

deepCleanup();

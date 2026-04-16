const mongoose = require('mongoose');

async function fixIndexes() {
    const uri = 'mongodb://localhost:27017/clickpet';
    console.log('Connecting to:', uri);
    
    try {
        await mongoose.connect(uri);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const collection = db.collection('coupons');
        
        console.log('--- Current Indexes ---');
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));
        
        // Look for the old unique index on "code"
        const oldIndex = indexes.find(idx => idx.name === 'code_1' && idx.unique);
        
        if (oldIndex) {
            console.log('Found old unique index "code_1". Dropping it...');
            await collection.dropIndex('code_1');
            console.log('Successfully dropped "code_1"!');
        } else {
            console.log('Old unique index "code_1" not found or not unique.');
        }
        
        console.log('--- Final Indexes ---');
        const finalIndexes = await collection.indexes();
        console.log(JSON.stringify(finalIndexes, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

fixIndexes();

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set environment variables for tests immediately
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Placeholder
}

let mongo: any;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    
    // Set MONGODB_URI to the memory server URI
    process.env.MONGODB_URI = uri;

    // Connect to the memory server
    await mongoose.connect(uri);
});

beforeEach(async () => {
    if (!mongoose.connection.db) {
        throw new Error('Database connection not established');
    }
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    if (mongo) {
        await mongo.stop();
    }
    await mongoose.connection.close();
});

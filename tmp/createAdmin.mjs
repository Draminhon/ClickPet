import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickpet';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('Error: ENCRYPTION_KEY must be exactly 32 characters.');
    process.exit(1);
}

// Define the User schema directly to avoid issues with ESM/CommonJS imports of the model
// and mongoose-field-encryption plugin during a simple script execution.
// We use a simplified version because we only need to write, and the plugin will handle encryption if we use the same schema.
// However, it's safer to use the actual model if possible. 

// Let's try to import the model as a module.
// Since we are in an ESM environment (.mjs), we might have issues importing the .ts file directly without ts-node.
// I'll define the model here simplified but with the encryption plugin to ensure data is saved correctly.

import { fieldEncryption } from 'mongoose-field-encryption';

const AddressSchema = new mongoose.Schema({
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zip: String,
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
    },
}, { _id: false });

AddressSchema.plugin(fieldEncryption, {
    fields: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zip', 'coordinates'],
    secret: ENCRYPTION_KEY
});

const PixConfigSchema = new mongoose.Schema({
    keyType: { type: String, default: 'CPF' },
    key: { type: String, default: '' },
    beneficiary: { type: String, default: '' },
    dynamicPix: { type: Boolean, default: false },
}, { _id: false });

PixConfigSchema.plugin(fieldEncryption, {
    fields: ['key', 'beneficiary', 'keyType'],
    secret: ENCRYPTION_KEY
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ['customer', 'partner', 'admin'], default: 'customer' },
    cnpj: String,
    cpf: String,
    phone: String,
    address: AddressSchema,
    pixConfig: PixConfigSchema,
}, { timestamps: true });

UserSchema.plugin(fieldEncryption, {
    fields: ['cnpj', 'cpf', 'phone'],
    secret: ENCRYPTION_KEY
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const adminEmail = 'admin@clickpet.com';
        const hashedPassword = await bcrypt.hash('admin123', 12);

        const adminData = {
            name: 'Administrador ClickPet',
            password: hashedPassword,
            role: 'admin',
            tokenVersion: 0,
            twoFactorEnabled: false
        };

        const result = await User.findOneAndUpdate(
            { email: adminEmail },
            { $set: adminData },
            { upsert: true, new: true }
        );

        console.log('Admin user ENSURED successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log('Password: admin123');
        console.log('Fields updated: role=admin, tokenVersion=0, twoFactorEnabled=false');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();

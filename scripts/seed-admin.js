const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@clickpet.com' });

        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@clickpet.com');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Admin123!', 10);

        // Create admin user
        const admin = await User.create({
            name: 'Administrador',
            email: 'admin@clickpet.com',
            password: hashedPassword,
            role: 'admin',
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@clickpet.com');
        console.log('🔑 Password: Admin123!');
        console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();

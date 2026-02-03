const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@clickpet.com' });

        if (admin) {
            console.log('Admin user found:');
            console.log('ID:', admin._id);
            console.log('Name:', admin.name);
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
        } else {
            console.log('Admin user NOT found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();

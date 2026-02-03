
import mongoose from 'mongoose';
import './User'; // Ensure User model is registered


const ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['food', 'toys', 'pharma', 'bath', 'vet', 'pets', 'aquarismo'],
    },
    image: {
        type: String,
        default: '',
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);

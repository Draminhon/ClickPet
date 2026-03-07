
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
        enum: ['food', 'toys', 'pharma', 'bath', 'vet', 'pets', 'aquarismo', 'accessories'],
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
    },
    productType: {
        type: String, // e.g., "Ração"
        default: 'Produto',
    },
    subCategory: {
        type: String, // e.g., "Médio/Grande"
        default: 'Geral',
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    salesCount: {
        type: Number,
        default: 0,
    },
    images: {
        type: [String],
        default: [],
    },
    weights: {
        type: [String],
        default: [],
    },
    // NEW FIELDS
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    brand: {
        type: String,
        default: '',
    },
    sku: {
        type: String,
        default: '',
    },
    unit: {
        type: String,
        enum: ['un', 'kg', 'l', 'pct', 'cx'],
        default: 'un',
    },
}, { timestamps: true });

// Indexes for fast queries
ProductSchema.index({ partnerId: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });

if (mongoose.models.Product) {
    delete mongoose.models.Product;
}
export default mongoose.model('Product', ProductSchema);

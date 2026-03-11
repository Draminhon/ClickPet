import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a service name'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    category: {
        type: String,
        enum: ['bath', 'grooming', 'veterinary', 'training', 'aquarismo', 'daycare', 'hotel', 'other'],
        required: true,
    },
    species: {
        type: String,
        enum: ['dog', 'cat', 'fish', 'bird', 'all', 'other'],
        default: 'all',
    },
    prices: [{
        size: {
            type: String,
            enum: ['mini', 'small', 'medium', 'large', 'giant'],
            required: true,
        },
        price: {
            type: Number,
            required: true,
        }
    }],
    duration: {
        type: Number, // in minutes
    },
    image: {
        type: String,
        default: '',
    },
    // NEW FIELDS
    isActive: {
        type: Boolean,
        default: true,
    },
    availability: [{
        day: {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        startTime: String, // "08:00"
        endTime: String,   // "18:00"
    }],
}, { timestamps: true });

ServiceSchema.index({ partnerId: 1 });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);

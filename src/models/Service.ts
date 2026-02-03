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
        enum: ['bath', 'grooming', 'veterinary', 'training', 'aquarismo', 'other'],
        required: true,
    },
    prices: [{
        size: {
            type: String,
            enum: ['small', 'medium', 'large', 'xlarge'],
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
    }
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);

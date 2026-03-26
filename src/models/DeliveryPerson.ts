import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';

const DeliveryPersonSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
    },
    email: {
        type: String,
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'motorcycle', 'car'],
        required: true,
    },
    licensePlate: {
        type: String,
    },
    photo: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // NEW FIELDS
    status: {
        type: String,
        enum: ['available', 'delivering', 'offline'],
        default: 'offline',
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    deliveryCount: {
        type: Number,
        default: 0,
    },
    entryDate: {
        type: Date,
        default: Date.now,
    },
    cnhCategory: {
        type: String,
        default: 'A',
    },
}, { timestamps: true });

DeliveryPersonSchema.plugin(fieldEncryption, {
    fields: ['phone', 'licensePlate'],
    secret: process.env.ENCRYPTION_KEY
});

DeliveryPersonSchema.index({ partnerId: 1 });
DeliveryPersonSchema.index({ status: 1 });

// Force model refresh for schema changes in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.DeliveryPerson;
}

export default mongoose.models.DeliveryPerson || mongoose.model('DeliveryPerson', DeliveryPersonSchema);

import mongoose from 'mongoose';

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
    }
}, { timestamps: true });

export default mongoose.models.DeliveryPerson || mongoose.model('DeliveryPerson', DeliveryPersonSchema);

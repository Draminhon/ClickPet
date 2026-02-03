import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    role: {
        type: String,
        enum: ['customer', 'partner', 'admin'],
        default: 'customer',
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
    },
    cnpj: {
        type: String,
        required: function (this: any) {
            return this.role === 'partner';
        }
    },
    address: {
        street: String,
        number: String,
        complement: String,
        city: String,
        zip: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere',
            },
        },
    },
    phone: {
        type: String,
    },
    minimumOrderValue: {
        type: Number,
        default: 0,
    },
    // Delivery settings (for partners)
    deliveryRadius: {
        type: Number,
        default: 10, // km
    },
    deliveryFeePerKm: {
        type: Number,
        default: 2, // R$ per km
    },
    freeDeliveryMinimum: {
        type: Number,
        default: 0, // R$ 0 = no free delivery
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

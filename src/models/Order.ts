import mongoose from 'mongoose';
import './User'; // Ensure User model is registered
import './DeliveryPerson';

// Added log to tracks version of the model
console.log('[Order Model] Initializing Order schema version with complement field');
const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        price: Number,
        quantity: Number,
        shopName: String,
    }],
    total: {
        type: Number,
        required: true,
    },
    deliveryFee: {
        type: Number,
        default: 0,
    },
    distance: {
        type: Number, // in km
    },
    isPickup: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPerson',
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
            },
        },
    },
    coupon: {
        type: String,
    },
    discount: {
        type: Number,
        default: 0,
    },
    // Loyalty points fields
    pointsEarned: {
        type: Number,
        default: 0,
    },
    pointsRedeemed: {
        type: Number,
        default: 0,
    },
    pointsDiscount: {
        type: Number,
        default: 0,
    },
    acceptedAt: {
        type: Date,
    },
    deliveredAt: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
    cancelReason: {
        type: String,
    }
}, { timestamps: true });

// Force model refresh for schema changes in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Order;
}

// Export with a fallback to the registered model
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);


import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import './User'; // Ensure User model is registered
import './DeliveryPerson';

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
    paymentMethod: {
        type: String,
        enum: ['pix', 'cartao', 'pix_cartao'],
        default: 'pix',
    },
    paymentStatus: {
        type: String,
        enum: ['approved', 'rejected', 'pending', 'cancelled'],
        default: 'pending',
    },
    abacatepayBillingId: {
        type: String,
    },
    abacatepayBillingUrl: {
        type: String,
    },
    abacatepayCustomerId: {
        type: String,
    },
    paymentStartedAt: {
        type: Date,
    },
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPerson',
    },
    address: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
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
    // NEW: Estimated delivery and status tracking
    estimatedDeliveryTime: {
        type: Date,
    },
    statusLog: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
    }],
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

OrderSchema.plugin(fieldEncryption, {
    fields: ['address.street', 'address.number', 'address.complement', 'address.neighborhood', 'address.city', 'address.state', 'address.zip'],
    secret: process.env.ENCRYPTION_KEY
});

// Indexes for fast queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ partnerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

// Export with a fallback to the registered model
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

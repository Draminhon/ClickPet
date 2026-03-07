import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a coupon code'],
        unique: true,
        uppercase: true,
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // NEW: type to distinguish percentage vs fixed value discount
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage',
    },
    discount: {
        type: Number,
        required: [true, 'Please provide a discount value'],
        min: 1,
    },
    // NEW: max discount cap for percentage coupons
    maxDiscount: {
        type: Number,
        default: null,
    },
    minPurchase: {
        type: Number,
        default: 0,
    },
    maxUses: {
        type: Number,
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

CouponSchema.index({ partnerId: 1 });
CouponSchema.index({ code: 1 });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

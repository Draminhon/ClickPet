import mongoose from 'mongoose';

const PointsTransactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral'],
        required: true,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    description: {
        type: String,
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

// Indexes for faster queries
PointsTransactionSchema.index({ userId: 1, createdAt: -1 });
PointsTransactionSchema.index({ type: 1 });

export default mongoose.models.PointsTransaction || mongoose.model('PointsTransaction', PointsTransactionSchema);

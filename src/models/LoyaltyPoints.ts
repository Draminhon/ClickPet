import mongoose from 'mongoose';

const LoyaltyPointsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    currentTier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze',
    },
    lifetimePoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    tierProgress: {
        type: Number,
        default: 0,
    },
    nextTier: {
        type: String,
        enum: ['silver', 'gold', 'platinum', 'max'],
        default: 'silver',
    },
}, { timestamps: true });

// Index for faster queries
LoyaltyPointsSchema.index({ userId: 1 });
LoyaltyPointsSchema.index({ currentTier: 1 });

// Tier thresholds
export const TIER_THRESHOLDS = {
    bronze: 0,
    silver: 500,
    gold: 1500,
    platinum: 3000,
};

export default mongoose.models.LoyaltyPoints || mongoose.model('LoyaltyPoints', LoyaltyPointsSchema);

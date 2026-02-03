import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    referredId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    referredEmail: {
        type: String,
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    status: {
        type: String,
        enum: ['pending', 'registered', 'completed'],
        default: 'pending',
    },
    pointsAwarded: {
        type: Number,
        default: 0,
    },
    orderCompleted: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
    },
}, { timestamps: true });

// Indexes
ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ code: 1 });
ReferralSchema.index({ referredEmail: 1 });

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);

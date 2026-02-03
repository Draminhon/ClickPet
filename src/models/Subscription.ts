import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Partner ID is required'],
        unique: true,
    },
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending', 'suspended'],
        default: 'pending',
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    autoRenew: {
        type: Boolean,
        default: false,
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'pix', 'boleto', 'manual'],
        default: 'manual',
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
    },
    features: {
        maxProducts: {
            type: Number,
            default: 10,
        },
        maxServices: {
            type: Number,
            default: 5,
        },
        hasAnalytics: {
            type: Boolean,
            default: false,
        },
        hasPrioritySupport: {
            type: Boolean,
            default: false,
        },
        hasAdvancedReports: {
            type: Boolean,
            default: false,
        },
        maxImages: {
            type: Number,
            default: 3,
        },
    },
    // History tracking
    history: [{
        action: {
            type: String,
            enum: ['created', 'upgraded', 'downgraded', 'renewed', 'cancelled', 'expired'],
        },
        previousPlan: String,
        newPlan: String,
        date: {
            type: Date,
            default: Date.now,
        },
        notes: String,
    }],
}, { timestamps: true });

// Index for efficient queries
SubscriptionSchema.index({ partnerId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function () {
    return this.status === 'active' && this.endDate > new Date();
};

// Method to check if subscription is expiring soon (within 7 days)
SubscriptionSchema.methods.isExpiringSoon = function () {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return this.status === 'active' && this.endDate <= sevenDaysFromNow && this.endDate > new Date();
};

// Static method to get plan features
SubscriptionSchema.statics.getPlanFeatures = function (plan: string) {
    const planFeatures: Record<string, any> = {
        free: {
            maxProducts: 10,
            maxServices: 5,
            hasAnalytics: false,
            hasPrioritySupport: false,
            hasAdvancedReports: false,
            maxImages: 3,
            price: 0,
        },
        basic: {
            maxProducts: 50,
            maxServices: 20,
            hasAnalytics: true,
            hasPrioritySupport: false,
            hasAdvancedReports: false,
            maxImages: 5,
            price: 49.90,
        },
        premium: {
            maxProducts: -1, // unlimited
            maxServices: -1, // unlimited
            hasAnalytics: true,
            hasPrioritySupport: false,
            hasAdvancedReports: true,
            maxImages: 10,
            price: 99.90,
        },
        enterprise: {
            maxProducts: -1, // unlimited
            maxServices: -1, // unlimited
            hasAnalytics: true,
            hasPrioritySupport: true,
            hasAdvancedReports: true,
            maxImages: -1, // unlimited
            price: 199.90,
        },
    };
    return planFeatures[plan] || planFeatures.free;
};

// TypeScript interface for the model
interface ISubscriptionModel extends mongoose.Model<any> {
    getPlanFeatures(plan: string): any;
}

export default (mongoose.models.Subscription as ISubscriptionModel) || mongoose.model<any, ISubscriptionModel>('Subscription', SubscriptionSchema);

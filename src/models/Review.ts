import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPerson',
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        maxlength: 500,
    },
    photos: [{
        type: String, // URLs to review photos
    }],
    helpfulCount: {
        type: Number,
        default: 0,
    },
    unhelpfulCount: {
        type: Number,
        default: 0,
    },
    verified: {
        type: Boolean,
        default: false, // True if from actual purchase
    },
    response: {
        text: String,
        respondedAt: Date,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
}, { timestamps: true });

// Index for faster queries
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ partnerId: 1 });
ReviewSchema.index({ deliveryPersonId: 1 });
ReviewSchema.index({ verified: 1, rating: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);


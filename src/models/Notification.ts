import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['order', 'message', 'appointment', 'system', 'promotion', 'delivery'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String,
    },
    read: {
        type: Boolean,
        default: false,
    },
    // Push notification fields
    pushToken: {
        type: String,
    },
    sentAt: {
        type: Date,
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'not_applicable'],
        default: 'pending',
    },
    actionData: {
        type: mongoose.Schema.Types.Mixed, // JSON data for deep linking
    },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ deliveryStatus: 1, createdAt: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);


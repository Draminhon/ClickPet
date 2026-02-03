import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

MessageSchema.index({ orderId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, read: 1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);

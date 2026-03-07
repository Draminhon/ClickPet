import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    userRole: {
        type: String,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
        type: String,
    },
}, { timestamps: true });

AuditLogSchema.plugin(fieldEncryption, {
    fields: ['details', 'ipAddress'],
    secret: process.env.ENCRYPTION_KEY
});

if (mongoose.models.AuditLog) {
    delete mongoose.models.AuditLog;
}

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

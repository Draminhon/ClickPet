import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    image: {
        type: String,
    },
    shopLogo: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    role: {
        type: String,
        enum: ['customer', 'partner', 'admin'],
        default: 'customer',
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
    },
    cnpj: {
        type: String,
        required: function (this: any) {
            return this.role === 'partner';
        }
    },
    cpf: {
        type: String,
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
                index: '2dsphere',
            },
        },
    },
    phone: {
        type: String,
    },
    minimumOrderValue: {
        type: Number,
        default: 0,
    },
    // Delivery settings (for partners)
    deliveryRadius: {
        type: Number,
        default: 10, // km
    },
    deliveryFeePerKm: {
        type: Number,
        default: 2, // R$ per km
    },
    freeDeliveryMinimum: {
        type: Number,
        default: 0, // R$ 0 = no free delivery
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    twoFactorSecret: {
        type: String,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Encrypt sensitive fields: CNPJ/CPF, phone, address components, and 2FA secret.
// Note: address.coordinates is NOT encrypted to preserve 2dsphere indexing.
// CRITICAL: ENCRYPTION_KEY must be EXACTLY 32 characters for AES-256-CBC (createCipheriv).
// If the key is not 32 chars, mongoose-field-encryption falls back to the deprecated 
// createDecipher/createCipher, which was REMOVED in Node v22+.
const ENC_KEY = process.env.ENCRYPTION_KEY;
if (ENC_KEY && ENC_KEY.length !== 32) {
    console.error(`[User Model] ENCRYPTION_KEY is ${ENC_KEY.length} chars — MUST be exactly 32! Encryption/decryption WILL fail.`);
}

UserSchema.plugin(fieldEncryption, {
    fields: ['cnpj', 'cpf', 'phone', 'address.street', 'address.number', 'address.complement', 'address.neighborhood', 'address.city', 'address.state', 'address.zip', 'twoFactorSecret'],
    secret: ENC_KEY || ''
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';

const ENC_KEY = process.env.ENCRYPTION_KEY;
if (ENC_KEY && ENC_KEY.length !== 32) {
    console.error(`[User Model] ENCRYPTION_KEY is ${ENC_KEY?.length || 0} chars — MUST be exactly 32!`);
}

const AddressSchema = new mongoose.Schema({
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
        coordinates: [Number], // [longitude, latitude]
    },
}, { _id: false });

AddressSchema.plugin(fieldEncryption, {
    fields: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zip', 'coordinates'],
    secret: ENC_KEY || ''
});

const PixConfigSchema = new mongoose.Schema({
    keyType: { type: String, default: 'CPF' },
    key: { type: String, default: '' },
    beneficiary: { type: String, default: '' },
    dynamicPix: { type: Boolean, default: false },
}, { _id: false });

PixConfigSchema.plugin(fieldEncryption, {
    fields: ['key', 'beneficiary', 'keyType'],
    secret: ENC_KEY || ''
});

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
        required: false,
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
    },
    cpf: {
        type: String,
    },
    address: AddressSchema,
    deliveryAddresses: [AddressSchema],
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
    workingHours: [{
        day: { type: String, required: true },
        active: { type: Boolean, default: true },
        open: { type: String, default: '08:00' },
        close: { type: String, default: '18:00' },
    }],
    // Payment settings
    paymentConfig: {
        creditCard: { type: Boolean, default: true },
        debitCard: { type: Boolean, default: true },
        cash: { type: Boolean, default: true },
    },
    paymentMethods: [{
        method: { type: String, required: true },
        fee: { type: Number, default: 0 },
        term: { type: String, default: '1 dia' },
    }],
    pixConfig: PixConfigSchema,
}, { timestamps: true });

UserSchema.plugin(fieldEncryption, {
    fields: ['cnpj', 'cpf', 'phone', 'twoFactorSecret'],
    secret: ENC_KEY || ''
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

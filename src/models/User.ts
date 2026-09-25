import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';
import crypto from 'crypto';

const ENC_KEY = process.env.ENCRYPTION_KEY;
if (ENC_KEY && ENC_KEY.length !== 32) {
    console.error(`[User Model] ENCRYPTION_KEY is ${ENC_KEY?.length || 0} chars — MUST be exactly 32!`);
}

export function hashEmail(email: string): string {
    if (!email) return '';
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
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

// Cartão salvo do cliente: só o que a ASAAS devolve depois de tokenizar
// (`cardToken`) — nunca o número do cartão nem o CVV. O PAN passa em
// trânsito pelo nosso backend (a ASAAS exige a chave privada da conta, então
// não dá pra tokenizar direto do app) mas nunca é logado nem persistido; para
// cobrar de novo, usamos o `cardToken` como referência do lado da ASAAS.
// `expirationMonth`/`expirationYear` são o que o próprio usuário informou no
// cadastro — a ASAAS não devolve a validade na resposta da tokenização, só
// bandeira e os 4 últimos dígitos, então são só para exibição.
//
// IMPORTANTE: `cardToken` NÃO é garantidamente único por cartão — no sandbox
// da ASAAS ele é fixo por customer, igual para qualquer número tokenizado
// (confirmado empiricamente: dois cartões de bandeira/número diferentes para
// o mesmo customer voltaram com o mesmo token). Por isso o subdocumento tem
// seu próprio `_id` (identidade real do registro, usada como key de lista e
// para excluir), enquanto `cardToken` continua sendo só a referência para
// cobrar na ASAAS.
const SavedCardSchema = new mongoose.Schema({
    cardToken: { type: String, required: true },
    lastFourDigits: { type: String, required: true },
    brand: { type: String, default: '' }, // ex: 'VISA', 'MASTERCARD'
    expirationMonth: { type: Number, required: true },
    expirationYear: { type: Number, required: true },
    cardholderName: { type: String, default: '' },
    addedAt: { type: Date, default: Date.now },
});

SavedCardSchema.plugin(fieldEncryption, {
    fields: ['cardholderName'],
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
    bannerImage: {
        type: String,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
    },
    emailHash: {
        type: String,
        required: [true, 'Please provide an email hash'],
        unique: true,
        index: true,
    },
    password: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ['customer', 'partner', 'veterinarian', 'admin'],
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
    // Cliente: forma de pagamento padrão, usada para pré-selecionar a opção
    // no checkout. Mesmos valores aceitos por Order.paymentMethod — não é uma
    // conta de cartão salva, só qual conjunto de métodos o checkout oferece.
    preferredPaymentMethod: {
        type: String,
        enum: ['pix', 'cartao', 'pix_cartao'],
        default: 'pix_cartao',
    },
    // Id do customer do cliente na ASAAS — criado na primeira vez que ele
    // salva um cartão, reaproveitado depois para tokenizar os próximos.
    asaasCustomerId: {
        type: String,
    },
    savedCards: [SavedCardSchema],
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
    specialization: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        default: '',
        required: [
            function (this: any) { return this.role === 'partner'; },
            'A biografia é obrigatória para parceiros',
        ],
        maxlength: [500, 'A biografia não pode ter mais de 500 caracteres'],
    },
    whatsapp: {
        type: String,
        default: '',
    },
    crmv: {
        type: String,
        default: '',
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

UserSchema.pre('validate', function (next) {
    if (this.email) {
        this.emailHash = hashEmail(this.email);
    }
    next();
});

UserSchema.plugin(fieldEncryption, {
    fields: ['cnpj', 'cpf', 'phone', 'whatsapp', 'twoFactorSecret', 'name', 'email'],
    secret: ENC_KEY || ''
});

export default mongoose.models.User || mongoose.model('User', UserSchema);

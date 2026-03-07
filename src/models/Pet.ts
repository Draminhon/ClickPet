import mongoose from 'mongoose';
import { fieldEncryption } from 'mongoose-field-encryption';

const PetSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    species: {
        type: String,
        enum: ['dog', 'cat', 'bird', 'fish', 'reptile', 'hamster', 'rabbit', 'other'],
        required: true,
    },
    breed: {
        type: String,
    },
    birthDate: {
        type: Date,
    },
    // Keep age for backward compatibility, but prefer birthDate
    age: {
        type: Number,
    },
    weight: {
        type: Number,
    },
    photo: {
        type: String,
        default: '',
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    size: {
        type: String,
        enum: ['mini', 'small', 'medium', 'large', 'giant'],
    },
    temperament: {
        type: String,
    },
    medicalNotes: {
        type: String,
        maxlength: 1000,
    },
    isVaccinated: {
        type: Boolean,
        default: false,
    },
    isNeutered: {
        type: Boolean,
        default: false,
    },
    microchipId: {
        type: String,
    },
    notes: {
        type: String,
        maxlength: 500,
    },
}, { timestamps: true });

PetSchema.plugin(fieldEncryption, {
    fields: ['medicalNotes', 'notes', 'microchipId'],
    secret: process.env.ENCRYPTION_KEY
});

PetSchema.index({ ownerId: 1 });

export default mongoose.models.Pet || mongoose.model('Pet', PetSchema);

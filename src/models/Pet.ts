import mongoose from 'mongoose';

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
        enum: ['dog', 'cat', 'bird', 'other'],
        required: true,
    },
    breed: {
        type: String,
    },
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
    notes: {
        type: String,
        maxlength: 500,
    },
}, { timestamps: true });

PetSchema.index({ ownerId: 1 });

export default mongoose.models.Pet || mongoose.model('Pet', PetSchema);

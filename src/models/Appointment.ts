import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
        default: 'pending',
    },
    notes: {
        type: String,
        maxlength: 500,
    },
    // NEW FIELDS
    price: {
        type: Number,
        default: 0,
    },
    petSize: {
        type: String,
        enum: ['mini', 'small', 'medium', 'large', 'giant'],
    },
    duration: {
        type: Number, // in minutes
    },
    cancelReason: {
        type: String,
    },
    confirmedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
}, { timestamps: true });

AppointmentSchema.index({ userId: 1 });
AppointmentSchema.index({ partnerId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

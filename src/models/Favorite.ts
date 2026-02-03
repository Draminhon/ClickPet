import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema({
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
}, { timestamps: true });

// Ensure user can't favorite the same item twice
FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true, sparse: true });
FavoriteSchema.index({ userId: 1, partnerId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);

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

// Ensure user can't favorite the same item twice.
// Partial (not sparse) indexes: a compound `sparse` index only skips a doc when
// ALL of its fields are missing, but `userId` is always present, so favoriting
// two different stores (both with no `productId`) collided on {userId, productId: null}.
FavoriteSchema.index(
    { userId: 1, productId: 1 },
    { unique: true, partialFilterExpression: { productId: { $exists: true } } },
);
FavoriteSchema.index(
    { userId: 1, partnerId: 1 },
    { unique: true, partialFilterExpression: { partnerId: { $exists: true } } },
);

export default mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);

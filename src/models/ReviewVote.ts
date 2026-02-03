import mongoose from 'mongoose';

const ReviewVoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true,
    },
    voteType: {
        type: String,
        enum: ['helpful', 'unhelpful'],
        required: true,
    },
}, { timestamps: true });

// Ensure user can only vote once per review
ReviewVoteSchema.index({ userId: 1, reviewId: 1 }, { unique: true });

export default mongoose.models.ReviewVote || mongoose.model('ReviewVote', ReviewVoteSchema);

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    title: { 
        type: String, 
        required: true,
        maxlength: 100
    },
    comment: { 
        type: String, 
        required: true,
        maxlength: 1000
    },
    helpful: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    verified: { 
        type: Boolean, 
        default: true 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    adminReply: {
        message: { 
            type: String,
            maxlength: 500
        },
        repliedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        repliedAt: { 
            type: Date 
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });

// Ensure one review per user per product per order
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default ReviewModel;
import ReviewModel from '../models/reviewModel.js';
import ProductModel from '../models/productModel.js';
import OrderModel from '../models/orderModel.js';
import UserModel from '../models/userModel.js';
import { invalidateProductCache } from '../middleware/cache.js';

// Get reviews for a specific product
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }
        
        let sortOption = { createdAt: -1 }; // Default: newest first
        
        switch (sort) {
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'highest':
                sortOption = { rating: -1, createdAt: -1 };
                break;
            case 'lowest':
                sortOption = { rating: 1, createdAt: -1 };
                break;
            case 'helpful':
                sortOption = { helpful: -1, createdAt: -1 };
                break;
        }
        
        const skip = (page - 1) * limit;
        
        const reviews = await ReviewModel.find({ productId, status: 'approved' })
            .populate('userId', 'name')
            .populate('adminReply.repliedBy', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalReviews = await ReviewModel.countDocuments({ productId, status: 'approved' });
        
        res.status(200).json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: skip + reviews.length < totalReviews,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new review
export const createReview = async (req, res) => {
    try {
        const { userId } = req.body;
        const { productId, orderId, rating, title, comment } = req.body;
        
        // Validate required fields
        if (!productId || !orderId || !rating || !title || !comment) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID, Order ID, rating, title, and comment are required' 
            });
        }
        
        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating must be between 1 and 5' 
            });
        }
        
        // Check if product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Verify that the user actually purchased this product in the specified order
        const order = await OrderModel.findOne({
            _id: orderId,
            userId: userId,
            'items.productId': productId,
            $or: [
                { paymentStatus: 'paid' },
                { payment: true }
            ]
        });
        
        if (!order) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only review products you have purchased' 
            });
        }
        
        // Check if user has already reviewed this product for this order
        const existingReview = await ReviewModel.findOne({
            productId,
            userId,
            orderId
        });
        
        if (existingReview) {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already reviewed this product for this order' 
            });
        }
        
        // Create the review
        const review = new ReviewModel({
            productId,
            userId,
            orderId,
            rating: parseInt(rating),
            title: title.trim(),
            comment: comment.trim(),
            verified: true
        });
        
        await review.save();
        
        // Update product review statistics
        await updateProductReviewStats(productId);
        
        // Invalidate product cache to ensure updated stats are shown
        invalidateProductCache(productId);
        
        res.status(201).json({ 
            success: true, 
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.body;
        
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        // Check if user already marked this review as helpful
        const alreadyHelpful = review.helpful.includes(userId);
        
        if (alreadyHelpful) {
            // Remove from helpful list
            review.helpful = review.helpful.filter(id => id.toString() !== userId);
        } else {
            // Add to helpful list
            review.helpful.push(userId);
        }
        
        await review.save();
        
        res.status(200).json({ 
            success: true, 
            message: alreadyHelpful ? 'Removed from helpful' : 'Marked as helpful',
            helpfulCount: review.helpful.length,
            isHelpful: !alreadyHelpful
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.body;
        const { page = 1, limit = 10 } = req.query;
        
        const skip = (page - 1) * limit;
        
        const reviews = await ReviewModel.find({ userId })
            .populate('productId', 'name image price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalReviews = await ReviewModel.countDocuments({ userId });
        
        res.status(200).json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: skip + reviews.length < totalReviews,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update review (only by the review author)
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId, rating, title, comment } = req.body;
        
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        // Check if the user is the author of the review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only update your own reviews' });
        }
        
        // Update fields if provided
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            }
            review.rating = parseInt(rating);
        }
        if (title !== undefined) review.title = title.trim();
        if (comment !== undefined) review.comment = comment.trim();
        
        await review.save();
        
        // Update product review statistics
        await updateProductReviewStats(review.productId);
        
        // Invalidate product cache to ensure updated stats are shown
        invalidateProductCache(review.productId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin reply to review
export const replyToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId, message } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reply message is required' 
            });
        }
        
        if (message.length > 500) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reply message must be 500 characters or less' 
            });
        }
        
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        // Update the review with admin reply
        review.adminReply = {
            message: message.trim(),
            repliedBy: userId,
            repliedAt: new Date()
        };
        
        await review.save();
        
        // Populate the reply with admin info for response
        await review.populate('adminReply.repliedBy', 'name');
        
        res.status(200).json({ 
            success: true, 
            message: 'Reply added successfully',
            review
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete admin reply
export const deleteReply = async (req, res) => {
    try {
        const { reviewId } = req.params;
        
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        if (!review.adminReply || !review.adminReply.message) {
            return res.status(404).json({ success: false, message: 'No reply found to delete' });
        }
        
        // Remove the admin reply
        review.adminReply = undefined;
        await review.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Reply deleted successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Get all reviews with filtering
export const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, productId } = req.query;
        
        let filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (productId) {
            filter.productId = productId;
        }
        
        let sortOption = { createdAt: -1 }; // Newest first
        
        const skip = (page - 1) * limit;
        
        const reviews = await ReviewModel.find(filter)
            .populate('userId', 'name email')
            .populate('productId', 'name image')
            .populate('adminReply.repliedBy', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));
            
        const totalReviews = await ReviewModel.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalReviews / limit),
                totalReviews,
                hasNext: skip + reviews.length < totalReviews,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin: Update review status
export const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status. Must be pending, approved, or rejected' 
            });
        }
        
        const review = await ReviewModel.findByIdAndUpdate(
            reviewId,
            { status },
            { new: true }
        ).populate('userId', 'name')
         .populate('productId', 'name');
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        // If status changed to approved or rejected, update product stats
        if (status === 'approved' || status === 'rejected') {
            await updateProductReviewStats(review.productId._id);
            invalidateProductCache(review.productId._id);
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Review ${status} successfully`,
            review
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Debug endpoint to check review stats
export const debugReviewStats = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const allReviews = await ReviewModel.find({ productId });
        const approvedReviews = await ReviewModel.find({ productId, status: 'approved' });
        const product = await ProductModel.findById(productId);
        
        res.status(200).json({
            success: true,
            debug: {
                productId,
                allReviews: allReviews.map(r => ({ 
                    _id: r._id, 
                    rating: r.rating, 
                    status: r.status,
                    createdAt: r.createdAt 
                })),
                approvedReviews: approvedReviews.map(r => ({ 
                    _id: r._id, 
                    rating: r.rating, 
                    status: r.status,
                    createdAt: r.createdAt 
                })),
                currentProductStats: product?.reviews,
                totalAllReviews: allReviews.length,
                totalApprovedReviews: approvedReviews.length
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete review (only by the review author)
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.body;
        
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        // Check if the user is the author of the review
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
        }
        
        const productId = review.productId;
        await ReviewModel.findByIdAndDelete(reviewId);
        
        // Update product review statistics
        await updateProductReviewStats(productId);
        
        // Invalidate product cache to ensure updated stats are shown
        invalidateProductCache(productId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper function to update product review statistics
const updateProductReviewStats = async (productId) => {
    try {
        console.log('Updating product review stats for product:', productId);
        const reviews = await ReviewModel.find({ productId, status: 'approved' });
        console.log('Found reviews:', reviews.length, reviews.map(r => ({ rating: r.rating, status: r.status })));
        
        if (reviews.length === 0) {
            console.log('No approved reviews found, setting stats to 0');
            await ProductModel.findByIdAndUpdate(productId, {
                'reviews.average': 0,
                'reviews.count': 0,
                'reviews.distribution': { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            });
            return;
        }
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const average = totalRating / reviews.length;
        
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            distribution[review.rating]++;
        });
        
        const newStats = {
            'reviews.average': Math.round(average * 10) / 10, // Round to 1 decimal place
            'reviews.count': reviews.length,
            'reviews.distribution': distribution
        };
        
        console.log('Updating product with new stats:', newStats);
        
        const result = await ProductModel.findByIdAndUpdate(productId, newStats, { new: true });
        console.log('Product updated successfully. New review stats:', result?.reviews);
    } catch (error) {
        console.error('Error updating product review stats:', error);
    }
};
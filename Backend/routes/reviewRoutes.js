import express from 'express';
import {
    getProductReviews,
    createReview,
    markReviewHelpful,
    getUserReviews,
    updateReview,
    deleteReview,
    debugReviewStats,
    replyToReview,
    deleteReply,
    getAllReviews,
    updateReviewStatus
} from '../controllers/reviewController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/product/:productId', getProductReviews);

// Debug route
reviewRouter.get('/debug/:productId', debugReviewStats);

// Protected routes (require authentication)
reviewRouter.post('/create', authUser, createReview);
reviewRouter.put('/:reviewId/helpful', authUser, markReviewHelpful);
reviewRouter.get('/user', authUser, getUserReviews);
reviewRouter.put('/:reviewId', authUser, updateReview);
reviewRouter.delete('/:reviewId', authUser, deleteReview);

// Admin routes
reviewRouter.get('/admin/list', adminAuth, getAllReviews);
reviewRouter.put('/admin/:reviewId/status', adminAuth, updateReviewStatus);
reviewRouter.post('/:reviewId/reply', adminAuth, replyToReview);
reviewRouter.delete('/:reviewId/reply', adminAuth, deleteReply);

export default reviewRouter;
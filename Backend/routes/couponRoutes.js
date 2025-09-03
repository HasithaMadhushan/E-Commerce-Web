import express from 'express';
import {
    validateCoupon,
    createCoupon,
    getAllCoupons,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon,
    getCouponStats
} from '../controllers/couponController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const couponRouter = express.Router();

// Public/User routes
couponRouter.post('/validate', authUser, validateCoupon);

// Admin routes
couponRouter.post('/create', adminAuth, createCoupon);
couponRouter.get('/list', adminAuth, getAllCoupons);
couponRouter.put('/:couponId', adminAuth, updateCoupon);
couponRouter.patch('/:couponId/toggle', adminAuth, toggleCouponStatus);
couponRouter.delete('/:couponId', adminAuth, deleteCoupon);
couponRouter.get('/:couponId/stats', adminAuth, getCouponStats);

export default couponRouter;
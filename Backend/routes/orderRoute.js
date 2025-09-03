import express from 'express';
import { 
    placeOrder,
    placeOrderStripe,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe,
    getOrderTracking,
    updateOrderStatus,
    getOrdersWithFilters,
    getOrderAnalytics,
    bulkUpdateOrderStatus
} from '../controllers/orderController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';
import { orderLimiter } from '../middleware/rateLimiter.js';
import { validateOrderPlacement } from '../middleware/validation.js';   

const orderRouter = express.Router();

//admin features
orderRouter.post('/list',adminAuth,allOrders);
orderRouter.get('/admin/list',adminAuth, getOrdersWithFilters);
orderRouter.get('/admin/analytics',adminAuth, getOrderAnalytics);
orderRouter.put('/status',adminAuth, updateStatus);
orderRouter.put('/admin/status',adminAuth, updateOrderStatus);
orderRouter.put('/admin/bulk-status',adminAuth, bulkUpdateOrderStatus);

//payment features with rate limiting and validation
orderRouter.post('/place', orderLimiter, authUser, placeOrder);
orderRouter.post('/stripe', orderLimiter, authUser, placeOrderStripe);

//user features
orderRouter.get('/user-orders', authUser, userOrders);

// Debug endpoint to test authentication
orderRouter.get('/debug/auth', authUser, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Authentication working', 
        userId: req.body.userId,
        timestamp: new Date().toISOString()
    });
});

//tracking features
orderRouter.get('/tracking/:orderId', authUser, getOrderTracking);
orderRouter.get('/admin/tracking/:orderId', adminAuth, getOrderTracking);

//verify payment
orderRouter.post('/verifyStripe', authUser, verifyStripe);

export default orderRouter;

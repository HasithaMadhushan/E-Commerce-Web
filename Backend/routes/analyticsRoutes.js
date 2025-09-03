import express from 'express'
import {
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
} from '../controllers/analyticsController.js'
import adminAuth from '../middleware/adminAuth.js'

const analyticsRouter = express.Router()

// All analytics routes require admin authentication
analyticsRouter.use(adminAuth)

// Dashboard overview stats
analyticsRouter.get('/dashboard', getDashboardStats)

// Sales analytics
analyticsRouter.get('/sales', getSalesAnalytics)

// Product analytics
analyticsRouter.get('/products', getProductAnalytics)

// Customer analytics
analyticsRouter.get('/customers', getCustomerAnalytics)

export default analyticsRouter
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import productRouter from './routes/productRoutes.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import reviewRouter from './routes/reviewRoutes.js'
import couponRouter from './routes/couponRoutes.js'
import analyticsRouter from './routes/analyticsRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { generalLimiter, apiLimiter, productLimiter } from './middleware/rateLimiter.js'
import { securityHeaders, corsOptions, sanitizeInput, requestSizeLimiter, securityLogger } from './middleware/security.js'
import { compressionMiddleware, optimizeResponse, optimizeRequest, memoryMonitor, responseTimeMonitor } from './middleware/compression.js'

// App config
const app = express()
const port = process.env.PORT || 4000

// Initialize connections
connectDB()
connectCloudinary()

// Performance middlewares
app.use(compressionMiddleware)
app.use(responseTimeMonitor)
app.use(memoryMonitor)

// Security middlewares
app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(securityLogger)
app.use(requestSizeLimiter)
app.use(generalLimiter)

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input sanitization
app.use(sanitizeInput)

// Request optimization
// app.use(optimizeRequest) // Temporarily disabled due to req.query modification issue
// app.use(optimizeResponse) // Temporarily disabled

// API endpoints with rate limiting
app.use('/api/user', apiLimiter, userRouter)
app.use('/api/product', productLimiter, productRouter) // Use more lenient rate limiting for products
app.use('/api/cart', apiLimiter, cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/coupons', couponRouter)
app.use('/api/analytics', analyticsRouter)

app.get('/', (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'API Working!' })
    } catch (error) {
        console.error('Root route error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Handle common browser requests to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
})

// Handle Chrome DevTools and other well-known requests
app.use('/.well-known', (req, res) => {
    res.status(204).end()
})

// Handle robots.txt
app.get('/robots.txt', (req, res) => {
    res.type('text/plain')
    res.send('User-agent: *\nDisallow: /api/')
})

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// For Vercel deployment
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => console.log('Server started on PORT:' + port))
}



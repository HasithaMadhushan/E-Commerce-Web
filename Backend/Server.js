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

// Diagnostic endpoints
app.get('/api/health', (req, res) => {
    try {
        const envCheck = {
            MONGODB_URI: !!process.env.MONGODB_URI,
            JWT_SECRET: !!process.env.JWT_SECRET,
            ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
            ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
            CLOUDINARY_NAME: !!process.env.CLOUDINARY_NAME,
            CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_SECRET_KEY: !!process.env.CLOUDINARY_SECRET_KEY,
            NODE_ENV: process.env.NODE_ENV || 'development'
        }
        
        const missingVars = Object.entries(envCheck)
            .filter(([key, value]) => key !== 'NODE_ENV' && !value)
            .map(([key]) => key)
            
        res.status(200).json({ 
            success: true, 
            message: 'Environment check',
            environment: envCheck,
            missing: missingVars,
            dbConnection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            dbState: mongoose.connection.readyState,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Health check error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Test database connection and simple query
app.get('/api/test-db', async (req, res) => {
    try {
        console.log('Testing database connection...')
        console.log('DB State:', mongoose.connection.readyState)
        
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected',
                dbState: mongoose.connection.readyState
            })
        }
        
        // Import the model dynamically to avoid issues
        const { default: ProductModel } = await import('./models/productModel.js')
        
        // Try a simple count query
        const productCount = await ProductModel.countDocuments()
        console.log('Product count:', productCount)
        
        res.status(200).json({ 
            success: true, 
            message: 'Database test successful',
            productCount,
            dbState: mongoose.connection.readyState,
            dbName: mongoose.connection.db?.databaseName || 'Unknown'
        })
    } catch (error) {
        console.error('Database test error:', error)
        res.status(500).json({ 
            success: false, 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            dbState: mongoose.connection.readyState
        })
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



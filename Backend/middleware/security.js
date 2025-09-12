import helmet from 'helmet'
import cors from 'cors'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      // Current deployment URLs
      'https://e-commerce-web-frontend-delta.vercel.app',
      'https://e-commerce-web-coral-two.vercel.app',
      // Previous deployment URLs (keeping for safety)
      'https://e-commerce-web-frontend-six.vercel.app',
      'https://adminpanel-seven-pied.vercel.app',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL
    ].filter(Boolean)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token']
}

// Input sanitization middleware (temporarily simplified)
export const sanitizeInput = (req, res, next) => {
  // Simple pass-through middleware for now
  // TODO: Re-implement sanitization without modifying req.query
  next()
}

// Request size limiter
export const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length'))
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    })
  }
  
  next()
}

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) return next()
    
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      })
    }
    
    next()
  }
}

// CSRF protection for state-changing operations
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  
  // Check for CSRF token in header
  const csrfToken = req.get('X-CSRF-Token') || req.body.csrfToken
  const sessionToken = req.get('X-Session-Token') || req.body.sessionToken
  
  // For API requests, we'll use a simple token validation
  // In production, implement proper CSRF tokens
  if (!csrfToken && !sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token required'
    })
  }
  
  next()
}

// Security logging middleware
export const securityLogger = (req, res, next) => {
  const startTime = Date.now()
  
  // Log security-relevant events
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - startTime
    
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log(`[SECURITY] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${req.ip} - ${duration}ms`)
    }
    
    // Log suspicious activity (multiple failed requests) - ignore common browser requests
    const ignoredPaths = ['favicon.ico', '.well-known', 'robots.txt', 'sitemap.xml']
    const shouldIgnore = ignoredPaths.some(path => req.originalUrl.includes(path))
    
    if (res.statusCode >= 400 && duration < 100 && !shouldIgnore) {
      console.log(`[SUSPICIOUS] Fast ${res.statusCode} response: ${req.method} ${req.originalUrl} - ${req.ip}`)
    }
    
    originalSend.call(this, data)
  }
  
  next()
}
import compression from 'compression'

// Compression middleware with custom configuration
export const compressionMiddleware = compression({
  // Only compress responses that are larger than this threshold (in bytes)
  threshold: 1024,
  
  // Compression level (1-9, where 9 is best compression but slowest)
  level: 6,
  
  // Only compress these MIME types
  filter: (req, res) => {
    // Don't compress if the request includes a 'x-no-compression' header
    if (req.headers['x-no-compression']) {
      return false
    }
    
    // Use compression for these content types
    const contentType = res.getHeader('content-type')
    if (!contentType) return false
    
    return /json|text|javascript|css|xml|svg/.test(contentType)
  },
  
  // Memory level (1-9, where 9 uses most memory but is fastest)
  memLevel: 8
})

// Response optimization middleware
export const optimizeResponse = (req, res, next) => {
  // Set cache headers for static-like content
  if (req.path.includes('/api/product/list') || req.path.includes('/api/product/categories')) {
    res.set('Cache-Control', 'public, max-age=300') // 5 minutes
  }
  
  // Set ETag for cacheable responses
  const originalJson = res.json
  res.json = function(data) {
    if (res.statusCode === 200 && data.success) {
      const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`
      res.set('ETag', etag)
      
      // Check if client has cached version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end()
      }
    }
    return originalJson.call(this, data)
  }
  
  next()
}

// Request optimization middleware
export const optimizeRequest = (req, res, next) => {
  // Store optimized query parameters in a separate property
  req.optimizedQuery = { ...req.query }
  
  // Parse and validate pagination parameters
  if (req.optimizedQuery.page) {
    const page = parseInt(req.optimizedQuery.page)
    req.optimizedQuery.page = isNaN(page) || page < 1 ? 1 : Math.min(page, 1000) // Max 1000 pages
  }
  
  if (req.optimizedQuery.limit) {
    const limit = parseInt(req.optimizedQuery.limit)
    req.optimizedQuery.limit = isNaN(limit) || limit < 1 ? 20 : Math.min(limit, 100) // Max 100 items per page
  }
  
  // Optimize sort parameters
  const allowedSortFields = ['price', 'name', 'createdAt', 'rating', 'popularity']
  if (req.optimizedQuery.sortBy && !allowedSortFields.includes(req.optimizedQuery.sortBy.replace(/^-/, ''))) {
    req.optimizedQuery.sortBy = 'createdAt'
  }
  
  next()
}

// Database query optimization helpers
export const optimizeQuery = (query) => {
  // Add lean() for read-only operations to improve performance
  if (typeof query.lean === 'function') {
    query = query.lean()
  }
  
  // Add select() to limit fields if not already specified
  if (typeof query.select === 'function' && !query.getQuery().$select) {
    // Default fields for product queries
    if (query.model.modelName === 'Product') {
      query = query.select('name price image category subCategory rating stock inventory bestseller')
    }
  }
  
  return query
}

// Memory usage monitoring
export const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage()
  
  // Log memory usage if it's high
  if (used.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn(`High memory usage: ${Math.round(used.heapUsed / 1024 / 1024)} MB`)
  }
  
  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.set('X-Memory-Usage', `${Math.round(used.heapUsed / 1024 / 1024)}MB`)
  }
  
  next()
}

// Response time monitoring
export const responseTimeMonitor = (req, res, next) => {
  const start = Date.now()
  
  // Set response time header before response is sent
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - start
    
    // Log slow requests
    if (duration > 1000) { // 1 second
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`)
    }
    
    // Add response time header before sending
    if (!res.headersSent) {
      res.set('X-Response-Time', `${duration}ms`)
    }
    
    return originalSend.call(this, data)
  }
  
  next()
}
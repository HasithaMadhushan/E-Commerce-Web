import NodeCache from 'node-cache'

// Create cache instances with different TTL settings
const productCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes for products
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Better performance, but be careful with object mutations
})

const categoryCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes for categories (less frequent changes)
  checkperiod: 300
})

const analyticsCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for analytics (more frequent updates needed)
  checkperiod: 60
})

const searchCache = new NodeCache({ 
  stdTTL: 180, // 3 minutes for search results
  checkperiod: 60
})

// Generic cache middleware factory
export const createCacheMiddleware = (cache, keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const key = keyGenerator(req)
    const cachedData = cache.get(key)
    
    if (cachedData) {
      console.log(`Cache HIT: ${key}`)
      return res.json(cachedData)
    }
    
    console.log(`Cache MISS: ${key}`)
    
    // Store original res.json
    const originalJson = res.json
    
    // Override res.json to cache successful responses
    res.json = function(data) {
      if (res.statusCode === 200 && data.success) {
        const cacheTTL = ttl || cache.options.stdTTL
        cache.set(key, data, cacheTTL)
        console.log(`Cached: ${key} for ${cacheTTL}s`)
      }
      return originalJson.call(this, data)
    }
    
    next()
  }
}

// Product list cache middleware
export const cacheProductList = createCacheMiddleware(
  productCache,
  (req) => {
    const { page = 1, limit = 20, category, subCategory, search, sortBy, minPrice, maxPrice } = req.query
    return `products:${page}:${limit}:${category || ''}:${subCategory || ''}:${search || ''}:${sortBy || ''}:${minPrice || ''}:${maxPrice || ''}`
  }
)

// Single product cache middleware
export const cacheProduct = createCacheMiddleware(
  productCache,
  (req) => `product:${req.params.id}`
)

// Categories cache middleware
export const cacheCategories = createCacheMiddleware(
  categoryCache,
  () => 'categories:all'
)

// Search results cache middleware
export const cacheSearch = createCacheMiddleware(
  searchCache,
  (req) => {
    const { q, category, minPrice, maxPrice, sortBy, page = 1 } = req.query
    return `search:${q || ''}:${category || ''}:${minPrice || ''}:${maxPrice || ''}:${sortBy || ''}:${page}`
  }
)

// Analytics cache middleware
export const cacheAnalytics = createCacheMiddleware(
  analyticsCache,
  (req) => {
    const { period = '30', type = 'dashboard' } = req.query
    return `analytics:${type}:${period}`
  }
)

// Cache invalidation helpers
export const invalidateProductCache = (productId = null) => {
  if (productId) {
    productCache.del(`product:${productId}`)
    console.log(`Invalidated cache for product: ${productId}`)
  }
  
  // Clear all product list caches (they might contain the updated product)
  const keys = productCache.keys()
  keys.forEach(key => {
    if (key.startsWith('products:')) {
      productCache.del(key)
    }
  })
  console.log('Invalidated all product list caches')
}

export const invalidateCategoryCache = () => {
  categoryCache.flushAll()
  console.log('Invalidated all category caches')
}

export const invalidateSearchCache = () => {
  searchCache.flushAll()
  console.log('Invalidated all search caches')
}

export const invalidateAnalyticsCache = () => {
  analyticsCache.flushAll()
  console.log('Invalidated all analytics caches')
}

// Cache statistics
export const getCacheStats = () => {
  return {
    products: {
      keys: productCache.getStats().keys,
      hits: productCache.getStats().hits,
      misses: productCache.getStats().misses
    },
    categories: {
      keys: categoryCache.getStats().keys,
      hits: categoryCache.getStats().hits,
      misses: categoryCache.getStats().misses
    },
    analytics: {
      keys: analyticsCache.getStats().keys,
      hits: analyticsCache.getStats().hits,
      misses: analyticsCache.getStats().misses
    },
    search: {
      keys: searchCache.getStats().keys,
      hits: searchCache.getStats().hits,
      misses: searchCache.getStats().misses
    }
  }
}

// Warm up cache with popular products
export const warmUpCache = async () => {
  try {
    console.log('Warming up cache...')
    // This would typically fetch popular products and cache them
    // Implementation depends on your specific needs
    console.log('Cache warm-up completed')
  } catch (error) {
    console.error('Cache warm-up failed:', error)
  }
}
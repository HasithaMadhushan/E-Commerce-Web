import request from 'supertest'
import express from 'express'
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js'
import userRoutes from '../routes/userRoutes.js'
import productRoutes from '../routes/productRoutes.js'
import orderRoutes from '../routes/orderRoute.js'
import couponRoutes from '../routes/couponRoutes.js'
import ProductModel from '../models/productModel.js'
import CouponModel from '../models/couponModel.js'

const app = express()
app.use(express.json())
app.use('/api/user', userRoutes)
app.use('/api/product', productRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/coupon', couponRoutes)

describe('E-Commerce Integration Tests', () => {
  let userToken
  let testProduct
  let testCoupon

  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    
    // Create test product
    testProduct = await ProductModel.create({
      name: 'Integration Test Product',
      description: 'Test product for integration testing',
      price: 100,
      image: ['test.jpg'],
      category: 'Men',
      subCategory: 'Topwear',
      sizes: ['S', 'M', 'L'],
      stock: 50,
      bestseller: true
    })

    // Create test coupon
    testCoupon = await CouponModel.create({
      code: 'INTEGRATION10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 50,
      maxDiscount: 50,
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
  })

  describe('Complete User Journey', () => {
    it('should complete full e-commerce flow: register -> browse -> add to cart -> apply coupon -> place order', async () => {
      // Step 1: User Registration
      const registerResponse = await request(app)
        .post('/api/user/register')
        .send({
          name: 'Integration Test User',
          email: 'integration@example.com',
          password: 'password123'
        })

      expect(registerResponse.status).toBe(200)
      expect(registerResponse.body.success).toBe(true)
      userToken = registerResponse.body.token

      // Step 2: Browse Products
      const browseResponse = await request(app)
        .get('/api/product/search?category=Men')

      expect(browseResponse.status).toBe(200)
      expect(browseResponse.body.success).toBe(true)
      expect(browseResponse.body.products).toHaveLength(1)

      // Step 3: Add to Cart
      const cartResponse = await request(app)
        .post('/api/user/cart')
        .set('token', userToken)
        .send({
          itemId: testProduct._id.toString(),
          size: 'M'
        })

      expect(cartResponse.status).toBe(200)
      expect(cartResponse.body.success).toBe(true)

      // Step 4: Get Cart
      const getCartResponse = await request(app)
        .get('/api/user/cart')
        .set('token', userToken)

      expect(getCartResponse.status).toBe(200)
      expect(getCartResponse.body.success).toBe(true)
      expect(getCartResponse.body.cartData).toBeDefined()

      // Step 5: Validate Coupon
      const couponResponse = await request(app)
        .get('/api/coupon/validate/INTEGRATION10')
        .query({ orderAmount: 110 }) // 100 + 10 delivery

      expect(couponResponse.status).toBe(200)
      expect(couponResponse.body.success).toBe(true)
      expect(couponResponse.body.discount).toBe(10) // 10% of 100

      // Step 6: Place Order with Coupon
      const orderData = {
        items: [{
          _id: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          size: 'M'
        }],
        amount: 100, // After 10% discount: 110 - 10 = 100
        address: {
          firstName: 'Integration',
          lastName: 'User',
          email: 'integration@example.com',
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipcode: '12345',
          country: 'Test Country',
          phone: '1234567890'
        },
        couponCode: 'INTEGRATION10'
      }

      const orderResponse = await request(app)
        .post('/api/order/place')
        .set('token', userToken)
        .send(orderData)

      expect(orderResponse.status).toBe(200)
      expect(orderResponse.body.success).toBe(true)

      // Step 7: Verify Order was Created
      const userOrdersResponse = await request(app)
        .get('/api/order/userorders')
        .set('token', userToken)

      expect(userOrdersResponse.status).toBe(200)
      expect(userOrdersResponse.body.success).toBe(true)
      expect(userOrdersResponse.body.orders).toHaveLength(1)

      // Step 8: Verify Stock was Decremented
      const updatedProduct = await ProductModel.findById(testProduct._id)
      expect(updatedProduct.stock).toBe(49)

      // Step 9: Verify Coupon Usage was Incremented
      const updatedCoupon = await CouponModel.findById(testCoupon._id)
      expect(updatedCoupon.usedCount).toBe(1)
    })

    it('should handle wishlist functionality', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/user/register')
        .send({
          name: 'Wishlist Test User',
          email: 'wishlist@example.com',
          password: 'password123'
        })

      userToken = registerResponse.body.token

      // Add to wishlist
      const addWishlistResponse = await request(app)
        .post('/api/user/wishlist/add')
        .set('token', userToken)
        .send({ productId: testProduct._id.toString() })

      expect(addWishlistResponse.status).toBe(200)
      expect(addWishlistResponse.body.success).toBe(true)

      // Get wishlist
      const getWishlistResponse = await request(app)
        .get('/api/user/wishlist')
        .set('token', userToken)

      expect(getWishlistResponse.status).toBe(200)
      expect(getWishlistResponse.body.success).toBe(true)
      expect(getWishlistResponse.body.wishlist).toHaveLength(1)

      // Remove from wishlist
      const removeWishlistResponse = await request(app)
        .delete('/api/user/wishlist/remove')
        .set('token', userToken)
        .send({ productId: testProduct._id.toString() })

      expect(removeWishlistResponse.status).toBe(200)
      expect(removeWishlistResponse.body.success).toBe(true)

      // Verify wishlist is empty
      const emptyWishlistResponse = await request(app)
        .get('/api/user/wishlist')
        .set('token', userToken)

      expect(emptyWishlistResponse.status).toBe(200)
      expect(emptyWishlistResponse.body.wishlist).toHaveLength(0)
    })

    it('should handle search and filtering', async () => {
      // Create additional test products
      await ProductModel.create([
        {
          name: 'Women Dress',
          description: 'Beautiful dress',
          price: 150,
          image: ['dress.jpg'],
          category: 'Women',
          subCategory: 'Topwear',
          sizes: ['S', 'M'],
          stock: 20,
          bestseller: false
        },
        {
          name: 'Kids Shirt',
          description: 'Colorful shirt',
          price: 50,
          image: ['shirt.jpg'],
          category: 'Kids',
          subCategory: 'Topwear',
          sizes: ['XS', 'S'],
          stock: 30,
          bestseller: true
        }
      ])

      // Test text search
      const searchResponse = await request(app)
        .get('/api/product/search?q=dress')

      expect(searchResponse.status).toBe(200)
      expect(searchResponse.body.products).toHaveLength(1)
      expect(searchResponse.body.products[0].name).toBe('Women Dress')

      // Test category filter
      const categoryResponse = await request(app)
        .get('/api/product/search?category=Kids')

      expect(categoryResponse.status).toBe(200)
      expect(categoryResponse.body.products).toHaveLength(1)
      expect(categoryResponse.body.products[0].category).toBe('Kids')

      // Test price range filter
      const priceResponse = await request(app)
        .get('/api/product/search?minPrice=100&maxPrice=200')

      expect(priceResponse.status).toBe(200)
      expect(priceResponse.body.products).toHaveLength(2) // Integration Test Product (100) and Women Dress (150)

      // Test bestseller filter
      const bestsellerResponse = await request(app)
        .get('/api/product/search?bestseller=true')

      expect(bestsellerResponse.status).toBe(200)
      expect(bestsellerResponse.body.products).toHaveLength(2) // Integration Test Product and Kids Shirt

      // Test sorting
      const sortResponse = await request(app)
        .get('/api/product/search?sort=price_low')

      expect(sortResponse.status).toBe(200)
      expect(sortResponse.body.products[0].price).toBe(50) // Kids Shirt should be first
    })
  })
})
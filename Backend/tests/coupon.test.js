import request from 'supertest'
import express from 'express'
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js'
import couponRoutes from '../routes/couponRoutes.js'
import CouponModel from '../models/couponModel.js'

const app = express()
app.use(express.json())
app.use('/api/coupon', couponRoutes)

describe('Coupon Tests', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    
    // Create test coupons
    await CouponModel.create([
      {
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        minOrderAmount: 50,
        maxDiscount: 100,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        code: 'FLAT20',
        type: 'fixed',
        value: 20,
        minOrderAmount: 100,
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'EXPIRED',
        type: 'percentage',
        value: 15,
        minOrderAmount: 0,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expired yesterday
      }
    ])
  })

  describe('GET /api/coupon/validate/:code', () => {
    it('should validate percentage coupon successfully', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/SAVE10')
        .query({ orderAmount: 100 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.coupon.code).toBe('SAVE10')
      expect(response.body.discount).toBe(10) // 10% of 100
    })

    it('should validate fixed coupon successfully', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/FLAT20')
        .query({ orderAmount: 150 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.coupon.code).toBe('FLAT20')
      expect(response.body.discount).toBe(20) // Fixed 20
    })

    it('should not validate coupon with insufficient order amount', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/SAVE10')
        .query({ orderAmount: 30 }) // Less than minOrderAmount of 50

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('minimum order amount')
    })

    it('should not validate expired coupon', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/EXPIRED')
        .query({ orderAmount: 100 })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('expired')
    })

    it('should not validate non-existent coupon', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/NOTEXIST')
        .query({ orderAmount: 100 })

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('not found')
    })

    it('should respect maximum discount limit', async () => {
      const response = await request(app)
        .get('/api/coupon/validate/SAVE10')
        .query({ orderAmount: 2000 }) // 10% would be 200, but max is 100

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.discount).toBe(100) // Capped at maxDiscount
    })
  })

  describe('POST /api/coupon/apply', () => {
    it('should apply coupon and increment usage count', async () => {
      const response = await request(app)
        .post('/api/coupon/apply')
        .send({
          code: 'SAVE10',
          orderAmount: 100
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.discount).toBe(10)

      // Check if usage count was incremented
      const coupon = await CouponModel.findOne({ code: 'SAVE10' })
      expect(coupon.usedCount).toBe(1)
    })

    it('should not apply coupon when usage limit reached', async () => {
      // Set usage count to limit
      await CouponModel.updateOne(
        { code: 'SAVE10' },
        { usedCount: 100 } // Same as usageLimit
      )

      const response = await request(app)
        .post('/api/coupon/apply')
        .send({
          code: 'SAVE10',
          orderAmount: 100
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('usage limit')
    })
  })
})
import request from 'supertest'
import express from 'express'
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js'
import orderRoutes from '../routes/orderRoute.js'
import userRoutes from '../routes/userRoutes.js'
import ProductModel from '../models/productModel.js'
import UserModel from '../models/userModel.js'
import OrderModel from '../models/orderModel.js'

const app = express()
app.use(express.json())
app.use('/api/order', orderRoutes)
app.use('/api/user', userRoutes)

describe('Order Tests', () => {
  let userToken
  let adminToken
  let testProduct

  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/user/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    userToken = userResponse.body.token

    // Create test admin
    const admin = new UserModel({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true
    })
    await admin.save()

    // Create test product
    testProduct = await ProductModel.create({
      name: 'Test Product',
      description: 'Test description',
      price: 100,
      image: ['test.jpg'],
      category: 'Men',
      subCategory: 'Topwear',
      sizes: ['S', 'M', 'L'],
      stock: 50
    })
  })

  describe('POST /api/order/place', () => {
    it('should place COD order successfully', async () => {
      const orderData = {
        items: [{
          _id: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 2,
          size: 'M'
        }],
        amount: 210, // 200 + 10 delivery
        address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipcode: '12345',
          country: 'Test Country',
          phone: '1234567890'
        }
      }

      const response = await request(app)
        .post('/api/order/place')
        .set('token', userToken)
        .send(orderData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Order placed successfully')

      // Check if stock was decremented
      const updatedProduct = await ProductModel.findById(testProduct._id)
      expect(updatedProduct.stock).toBe(48)
    })

    it('should not place order with insufficient stock', async () => {
      const orderData = {
        items: [{
          _id: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 100, // More than available stock
          size: 'M'
        }],
        amount: 1010,
        address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipcode: '12345',
          country: 'Test Country',
          phone: '1234567890'
        }
      }

      const response = await request(app)
        .post('/api/order/place')
        .set('token', userToken)
        .send(orderData)

      expect(response.status).toBe(422)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Insufficient stock')
    })
  })

  describe('POST /api/order/stripe', () => {
    it('should create Stripe order with payment false', async () => {
      const orderData = {
        items: [{
          _id: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          size: 'M'
        }],
        amount: 110,
        address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipcode: '12345',
          country: 'Test Country',
          phone: '1234567890'
        }
      }

      // Mock Stripe session creation
      const originalStripe = process.env.STRIPE_SECRET_KEY
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock'

      const response = await request(app)
        .post('/api/order/stripe')
        .set('token', userToken)
        .set('origin', 'http://localhost:3000')
        .send(orderData)

      // Restore original Stripe key
      process.env.STRIPE_SECRET_KEY = originalStripe

      // Check if order was created with payment false
      const orders = await OrderModel.find({ paymentMethod: 'Stripe' })
      expect(orders).toHaveLength(1)
      expect(orders[0].payment).toBe(false)
    })
  })

  describe('GET /api/order/userorders', () => {
    it('should get user orders', async () => {
      // Create test order
      const order = new OrderModel({
        userId: userToken.split('.')[1], // Mock user ID from token
        items: [{
          _id: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1,
          size: 'M'
        }],
        amount: 110,
        address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          zipcode: '12345',
          country: 'Test Country',
          phone: '1234567890'
        },
        paymentMethod: 'COD',
        payment: false
      })
      await order.save()

      const response = await request(app)
        .get('/api/order/userorders')
        .set('token', userToken)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.orders).toHaveLength(1)
    })
  })
})
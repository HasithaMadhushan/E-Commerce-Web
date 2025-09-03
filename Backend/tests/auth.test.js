import request from 'supertest'
import express from 'express'
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js'
import userRoutes from '../routes/userRoutes.js'
import UserModel from '../models/userModel.js'

const app = express()
app.use(express.json())
app.use('/api/user', userRoutes)

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
  })

  describe('POST /api/user/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.token).toBeDefined()
    })

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should not register user with weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123'
      }

      const response = await request(app)
        .post('/api/user/register')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should not register duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }

      // Register first user
      await request(app)
        .post('/api/user/register')
        .send(userData)

      // Try to register with same email
      const response = await request(app)
        .post('/api/user/register')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/user/login', () => {
    beforeEach(async () => {
      // Create test user
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      }
      await request(app)
        .post('/api/user/register')
        .send(userData)
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.token).toBeDefined()
    })

    it('should not login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should not login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/api/user/login')
        .send(loginData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})
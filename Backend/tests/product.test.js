import request from 'supertest'
import express from 'express'
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js'
import productRoutes from '../routes/productRoutes.js'
import ProductModel from '../models/productModel.js'

const app = express()
app.use(express.json())
app.use('/api/product', productRoutes)

describe('Product Tests', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
    
    // Create test products
    await ProductModel.create([
      {
        name: 'Test Product 1',
        description: 'Test description 1',
        price: 100,
        image: ['test1.jpg'],
        category: 'Men',
        subCategory: 'Topwear',
        sizes: ['S', 'M', 'L'],
        stock: 50,
        bestseller: true
      },
      {
        name: 'Test Product 2',
        description: 'Test description 2',
        price: 200,
        image: ['test2.jpg'],
        category: 'Women',
        subCategory: 'Bottomwear',
        sizes: ['M', 'L', 'XL'],
        stock: 30,
        bestseller: false
      }
    ])
  })

  describe('GET /api/product/list', () => {
    it('should get all products', async () => {
      const response = await request(app)
        .get('/api/product/list')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(2)
    })
  })

  describe('GET /api/product/search', () => {
    it('should search products by name', async () => {
      const response = await request(app)
        .get('/api/product/search?q=Test Product 1')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(1)
      expect(response.body.products[0].name).toBe('Test Product 1')
    })

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/product/search?category=Men')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(1)
      expect(response.body.products[0].category).toBe('Men')
    })

    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/product/search?minPrice=150&maxPrice=250')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(1)
      expect(response.body.products[0].price).toBe(200)
    })

    it('should filter bestsellers', async () => {
      const response = await request(app)
        .get('/api/product/search?bestseller=true')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products).toHaveLength(1)
      expect(response.body.products[0].bestseller).toBe(true)
    })

    it('should sort products by price', async () => {
      const response = await request(app)
        .get('/api/product/search?sort=price_low')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.products[0].price).toBe(100)
      expect(response.body.products[1].price).toBe(200)
    })
  })

  describe('GET /api/product/filters', () => {
    it('should get available filter options', async () => {
      const response = await request(app)
        .get('/api/product/filters')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.filters.categories).toContain('Men')
      expect(response.body.filters.categories).toContain('Women')
      expect(response.body.filters.subCategories).toContain('Topwear')
      expect(response.body.filters.sizes).toContain('S')
    })
  })
})
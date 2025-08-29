import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { BaseController } from './base.controller.js'
import { companies, type Company } from '@econeura/db'
import { db, setOrg } from '@econeura/db'
import { requireAuth, requireOrg, setOrgContext } from '../middleware/auth.js'

// Create a test controller
class TestCompaniesController extends BaseController<Company, any, any> {
  constructor() {
    super(companies, 'orgId', 'name')
  }

  protected getResourceName(): string {
    return 'Company'
  }
}

const testController = new TestCompaniesController()

// Create test app
const app = express()
app.use(express.json())

// Mock auth middleware for testing
app.use((req, res, next) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    orgId: 'test-org-id'
  }
  req.orgId = 'test-org-id'
  next()
})

app.use(setOrgContext)

// Add routes
app.get('/companies', testController.list.bind(testController))
app.get('/companies/:id', testController.getById.bind(testController))
app.post('/companies', testController.create.bind(testController))
app.put('/companies/:id', testController.update.bind(testController))
app.delete('/companies/:id', testController.delete.bind(testController))

describe('BaseController CRUD Operations', () => {
  beforeEach(async () => {
    // Set up test organization context
    await setOrg('test-org-id')
    
    // Clean up test data
    await db.delete(companies)
  })

  afterEach(async () => {
    // Clean up test data
    await db.delete(companies)
  })

  describe('CREATE', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://test.com'
      }

      const response = await request(app)
        .post('/companies')
        .send(companyData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: companyData.name,
        industry: companyData.industry,
        website: companyData.website,
        orgId: 'test-org-id'
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/companies')
        .send({ industry: 'Technology' }) // Missing name
        .expect(400)

      expect(response.body.type).toBe('/validation-error')
      expect(response.body.title).toBe('Validation Error')
    })
  })

  describe('READ', () => {
    it('should list companies with pagination', async () => {
      // Create test companies
      await db.insert(companies).values([
        {
          orgId: 'test-org-id',
          name: 'Company 1',
          industry: 'Technology'
        },
        {
          orgId: 'test-org-id',
          name: 'Company 2',
          industry: 'Consulting'
        }
      ])

      const response = await request(app)
        .get('/companies')
        .expect(200)

      expect(response.body).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Company 1' }),
          expect.objectContaining({ name: 'Company 2' })
        ]),
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      })
    })

    it('should get company by ID', async () => {
      const [company] = await db.insert(companies).values({
        orgId: 'test-org-id',
        name: 'Test Company',
        industry: 'Technology'
      }).returning()

      const response = await request(app)
        .get(`/companies/${company.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: company.id,
        name: 'Test Company',
        industry: 'Technology'
      })
    })

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/companies/non-existent-id')
        .expect(404)

      expect(response.body.type).toBe('/not-found')
      expect(response.body.title).toBe('Company Not Found')
    })
  })

  describe('UPDATE', () => {
    it('should update company', async () => {
      const [company] = await db.insert(companies).values({
        orgId: 'test-org-id',
        name: 'Original Name',
        industry: 'Technology'
      }).returning()

      const updateData = {
        name: 'Updated Name',
        industry: 'Consulting'
      }

      const response = await request(app)
        .put(`/companies/${company.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        id: company.id,
        name: 'Updated Name',
        industry: 'Consulting'
      })
    })

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/companies/non-existent-id')
        .send({ name: 'Updated Name' })
        .expect(404)

      expect(response.body.type).toBe('/not-found')
      expect(response.body.title).toBe('Company Not Found')
    })
  })

  describe('DELETE', () => {
    it('should delete company', async () => {
      const [company] = await db.insert(companies).values({
        orgId: 'test-org-id',
        name: 'Test Company',
        industry: 'Technology'
      }).returning()

      await request(app)
        .delete(`/companies/${company.id}`)
        .expect(204)

      // Verify it's deleted
      const response = await request(app)
        .get(`/companies/${company.id}`)
        .expect(404)

      expect(response.body.type).toBe('/not-found')
    })

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .delete('/companies/non-existent-id')
        .expect(404)

      expect(response.body.type).toBe('/not-found')
      expect(response.body.title).toBe('Company Not Found')
    })
  })

  describe('RLS Isolation', () => {
    it('should isolate data between organizations', async () => {
      // Create companies for different orgs
      await db.insert(companies).values([
        {
          orgId: 'test-org-id',
          name: 'Test Org Company',
          industry: 'Technology'
        },
        {
          orgId: 'other-org-id',
          name: 'Other Org Company',
          industry: 'Consulting'
        }
      ])

      // Set context for test org
      await setOrg('test-org-id')

      const response = await request(app)
        .get('/companies')
        .expect(200)

      // Should only see test org companies
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBe('Test Org Company')
    })
  })
})



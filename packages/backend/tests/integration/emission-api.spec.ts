import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { createPrismaClient } from '../../src/services/prismaClient'

const prisma = createPrismaClient()

describe('integration: emission API (smoke)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    // Assume migrations + seed have been run by CI/orchestrator
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
  })

  it('POST /api/emissions creates an emission and returns 201', async () => {
    const payload = {
      site_id: '00000000-0000-0000-0000-000000000001',
      emission_type: 'scope_1',
      value: '12.34',
      unit: 'kgCO2e',
      timestamp: '2025-01-05T00:00:00Z',
    }

    const res = await request(app).post('/api/emissions').send(payload).set('Content-Type', 'application/json')
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('value', '12.34')
  })

  it('GET /api/emissions returns paginated results', async () => {
    const res = await request(app).get('/api/emissions')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('pagination')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

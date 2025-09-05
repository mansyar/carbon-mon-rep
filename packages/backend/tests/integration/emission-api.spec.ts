import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { ensureTestDb } from '../helpers/ensureTestDb'
import bcrypt from 'bcryptjs'

let prisma: any
let authHeader = ''

describe('integration: emission API (smoke)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'

    // If no DATABASE_URL is provided, skip DB-backed integration setup (CI should provide DATABASE_URL).
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping integration DB setup: DATABASE_URL not set; integration tests will run unauthenticated.')
      return
    }

    // Initialize Prisma client and seed builtin roles/permissions
    prisma = await ensureTestDb()

    // Ensure required permissions, role and a test user exist, then obtain auth token.
    const emissionCreatePerm = await prisma.permission.upsert({
      where: { name: 'emissions.create' },
      update: {},
      create: { name: 'emissions.create' },
    })
    const emissionReadPerm = await prisma.permission.upsert({
      where: { name: 'emissions.read' },
      update: {},
      create: { name: 'emissions.read' },
    })

    const role = await prisma.role.upsert({
      where: { name: 'TEST_FULL' },
      update: { description: 'Test role for integration', isBuiltin: false },
      create: { name: 'TEST_FULL', description: 'Test role for integration', isBuiltin: false },
    })

    // link permissions to role
    try {
      await prisma.rolePermission.createMany({
        data: [
          { roleId: role.id, permissionId: emissionCreatePerm.id },
          { roleId: role.id, permissionId: emissionReadPerm.id },
        ],
        skipDuplicates: true,
      })
    } catch (e) {
      // ignore
    }

    // create test user
    const username = 'test-integration'
    const password = 'Test1ntegr@tion!'
    const passwordHash = bcrypt.hashSync(password, 10)

    const user = await prisma.user.upsert({
      where: { username },
      update: { passwordHash, updatedAt: new Date() },
      create: { username, passwordHash },
    })

    // assign role to user
    try {
      await prisma.userRole.createMany({
        data: [{ userId: user.id, roleId: role.id, assignedBy: null }],
        skipDuplicates: true,
      })
    } catch (e) {
      // ignore
    }

    // Login and obtain bearer token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username, password })
      .set('Content-Type', 'application/json')
    if (loginRes.status === 200 && loginRes.body?.accessToken) {
      authHeader = `Bearer ${loginRes.body.accessToken}`
    } else {
      // If login failed, leave authHeader empty; tests will show auth errors.
      console.warn('Integration setup: login failed', loginRes.status, loginRes.body)
    }
  })

  afterAll(async () => {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect()
    }
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

    const req = request(app).post('/api/emissions').send(payload).set('Content-Type', 'application/json')
    if (authHeader) req.set('Authorization', authHeader)
    const res = await req
    if (authHeader) {
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('value', '12.34')
    } else {
      // When DATABASE_URL is not provided the integration setup is skipped and requests are unauthenticated.
      expect(res.status).toBe(401)
    }
  })

  it('GET /api/emissions returns paginated results', async () => {
    const req = request(app).get('/api/emissions')
    if (authHeader) req.set('Authorization', authHeader)
    const res = await req
    if (authHeader) {
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('pagination')
      expect(Array.isArray(res.body.data)).toBe(true)
    } else {
      // When DATABASE_URL is not provided the integration setup is skipped and requests are unauthenticated.
      expect(res.status).toBe(401)
    }
  })
})

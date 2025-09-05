import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { ensureTestDb } from '../helpers/ensureTestDb'
import bcrypt from 'bcryptjs'

let prisma: any
let accessToken = ''
let refreshToken = ''

describe('integration: auth API (login / refresh / revoke)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test'

    // If no DATABASE_URL is provided, skip DB-backed integration setup (CI should provide DATABASE_URL).
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping integration DB setup: DATABASE_URL not set; auth integration tests will run unauthenticated.')
      return
    }

    // Initialize Prisma client and seed builtin roles/permissions
    prisma = await ensureTestDb()

    // Ensure permission and role for exercising an authenticated protected endpoint
    const emissionReadPerm = await prisma.permission.upsert({
      where: { name: 'emissions.read' },
      update: {},
      create: { name: 'emissions.read' },
    })

    const role = await prisma.role.upsert({
      where: { name: 'TEST_AUTH' },
      update: { description: 'Test role for auth integration', isBuiltin: false },
      create: { name: 'TEST_AUTH', description: 'Test role for auth integration', isBuiltin: false },
    })

    // link permission to role (idempotent)
    try {
      await prisma.rolePermission.createMany({
        data: [{ roleId: role.id, permissionId: emissionReadPerm.id }],
        skipDuplicates: true,
      })
    } catch (e) {
      // ignore
    }

    // create test user
    const username = 'auth-integration'
    const password = 'Auth1ntegr@tion!'
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
  })

  afterAll(async () => {
    if (prisma && typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect()
    }
  })

  it('POST /api/auth/login with valid credentials returns tokens', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test: DATABASE_URL not set')
      return
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auth-integration', password: 'Auth1ntegr@tion!' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    accessToken = res.body.accessToken
    refreshToken = res.body.refreshToken
  })

  it('Access token can be used to call a protected endpoint (GET /api/emissions)', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test: DATABASE_URL not set')
      return
    }

    const res = await request(app).get('/api/emissions').set('Authorization', `Bearer ${accessToken}`)
    // user has emissions.read via assigned role
    expect(res.status).toBe(200)
  })

  it('POST /api/auth/refresh rotates refresh token (old token invalid after use)', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test: DATABASE_URL not set')
      return
    }

    // Use existing refresh token to obtain new tokens
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .set('Content-Type', 'application/json')

    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body).toHaveProperty('accessToken')
    expect(refreshRes.body).toHaveProperty('refreshToken')

    const newAccess = refreshRes.body.accessToken
    const newRefresh = refreshRes.body.refreshToken

    // Old refresh token should now be invalid (rotation)
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken }) // old token
      .set('Content-Type', 'application/json')

    expect(reuseRes.status).toBe(401)

    // update tokens for subsequent tests
    accessToken = newAccess
    refreshToken = newRefresh
  })

  it('POST /api/auth/revoke revokes a refresh token and prevents subsequent refresh', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test: DATABASE_URL not set')
      return
    }

    // Revoke current refresh token using authenticated request
    const revokeRes = await request(app)
      .post('/api/auth/revoke')
      .send({ refreshToken })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(revokeRes.status).toBe(200)

    // Attempt to use revoked refresh token
    const refreshAfterRevoke = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .set('Content-Type', 'application/json')

    expect(refreshAfterRevoke.status).toBe(401)
  })

  it('POST /api/auth/login with invalid credentials returns 401', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test: DATABASE_URL not set')
      return
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'auth-integration', password: 'wrong-password' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(401)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/config/redis', () => {
  return {
    default: {
      get: vi.fn(),
      set: vi.fn(),
      incr: vi.fn(),
    },
  }
})

vi.mock('../../src/services/prismaClient', () => {
  return {
    default: {
      userRole: {
        findMany: vi.fn(),
      },
      permission: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
      role: {
        upsert: vi.fn(),
      },
      rolePermission: {
        create: vi.fn(),
      },
    },
  }
})

import redis from '../../src/config/redis'
import prisma from '../../src/services/prismaClient'
import permissionService, {
  getUserPermissions,
  invalidateUserPermissions,
  seedBuiltinPermissionsAndRoles,
} from '../../src/services/permissionService'

describe('permissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getUserPermissions returns empty array for falsy userId', async () => {
    const perms = await getUserPermissions('')
    expect(perms).toEqual([])
  })

  it('getUserPermissions returns cached permissions when present', async () => {
    const userId = 'user-1'
    const cached = JSON.stringify(['emissions.read', 'audit.read'])
    // First redis.get returns a version (e.g. "1"), second returns the cached permset JSON.
    ;(redis.get as any).mockResolvedValueOnce('1') // permVersionKey
    ;(redis.get as any).mockResolvedValueOnce(cached) // permset cache key

    const perms = await getUserPermissions(userId)
    expect(perms).toEqual(['emissions.read', 'audit.read'])
    expect(prisma.userRole.findMany).not.toHaveBeenCalled()
  })

  it('getUserPermissions reads DB and caches result when cache miss', async () => {
    const userId = 'user-2'
    // Simulate missing perm version then missing cache
    ;(redis.get as any).mockResolvedValueOnce(null) // permVersionKey absent
    ;(redis.get as any).mockResolvedValueOnce(null) // cacheKey miss

    // Mock DB returning two userRoles with overlapping permissions
    const dbResult = [
      {
        role: {
          rolePermissions: [
            { permission: { name: 'emissions.read' } },
            { permission: { name: 'emissions.create' } },
          ],
        },
      },
      {
        role: {
          rolePermissions: [
            { permission: { name: 'emissions.read' } },
            { permission: { name: 'audit.read' } },
          ],
        },
      },
    ]
    ;(prisma.userRole.findMany as any).mockResolvedValueOnce(dbResult)
    ;(redis.set as any).mockResolvedValueOnce('OK') // set permversion (initialization)
    ;(redis.set as any).mockResolvedValueOnce('OK') // set permset cache

    const perms = await getUserPermissions(userId)
    expect(new Set(perms)).toEqual(new Set(['emissions.read', 'emissions.create', 'audit.read']))

    // Verify that a permset key was set at least once (search through calls)
    const setCalls = (redis.set as any).mock.calls.map((c: any[]) => c[0])
    const hasPermset = setCalls.some((k: string) => /permset:user:user-2:v/.test(k))
    expect(hasPermset).toBe(true)

    // Also verify cached payload includes expected permission
    const permsetCall = (redis.set as any).mock.calls.find((c: any[]) => /permset:user:user-2:v/.test(c[0]))
    expect(permsetCall).toBeTruthy()
    expect(JSON.parse(permsetCall![1])).toEqual(expect.arrayContaining(['emissions.read']))
  })

  it('invalidateUserPermissions increments permversion when userId provided', async () => {
    const userId = 'user-3'
    ;(redis.incr as any).mockResolvedValueOnce(2)
    await invalidateUserPermissions(userId)
    expect(redis.incr).toHaveBeenCalledWith(expect.stringContaining(`permversion:user:${userId}`))
  })

  it('invalidateUserPermissions does nothing when userId falsy', async () => {
    await invalidateUserPermissions('')
    expect(redis.incr).not.toHaveBeenCalled()
  })

  it('seedBuiltinPermissionsAndRoles upserts permissions and roles and creates rolePermission relations', async () => {
    ;(prisma.permission.upsert as any).mockResolvedValue({})
    ;(prisma.role.upsert as any).mockResolvedValue({ id: 'role-id' })
    ;(prisma.permission.findUnique as any).mockResolvedValue({ id: 'perm-id' })
    ;(prisma.rolePermission.create as any).mockResolvedValue({})

    await seedBuiltinPermissionsAndRoles()

    expect(prisma.permission.upsert).toHaveBeenCalled()
    expect(prisma.role.upsert).toHaveBeenCalled()
    expect(prisma.rolePermission.create).toHaveBeenCalled()
  })
})

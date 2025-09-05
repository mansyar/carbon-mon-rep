import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/services/prismaClient', () => {
  return {
    default: {
      role: {
        findMany: vi.fn(),
      },
      userRole: {
        createMany: vi.fn(),
      },
    },
  }
})

vi.mock('../../src/services/permissionService', () => {
  return {
    invalidateUserPermissions: vi.fn(),
    default: {
      getUserPermissions: vi.fn(),
      invalidateUserPermissions: vi.fn(),
      seedBuiltinPermissionsAndRoles: vi.fn(),
    },
  }
})

import prisma from '../../src/services/prismaClient'
import { listRoles, assignRoleToUser } from '../../src/services/roleService'
import { invalidateUserPermissions } from '../../src/services/permissionService'

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listRoles maps DB roles to DTOs', async () => {
    const now = new Date()
    ;(prisma.role.findMany as any).mockResolvedValueOnce([
      {
        id: 'role-1',
        name: 'ADMIN',
        description: 'Full access',
        isBuiltin: true,
        rolePermissions: [
          { permission: { name: 'emissions.read' } },
          { permission: { name: 'emissions.create' } },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'role-2',
        name: 'VIEWER',
        description: null,
        isBuiltin: true,
        rolePermissions: [{ permission: { name: 'emissions.read' } }],
        createdAt: now,
        updatedAt: now,
      },
    ])

    const roles = await listRoles()
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.length).toBe(2)

    const admin = roles.find((r) => r.id === 'role-1')!
    expect(admin.name).toBe('ADMIN')
    expect(admin.is_builtin).toBe(true)
    expect(admin.permissions).toEqual(expect.arrayContaining(['emissions.read', 'emissions.create']))
    expect(typeof admin.created_at).toBe('string')
  })

  it('assignRoleToUser creates userRole and invalidates permission cache', async () => {
    ;(prisma.userRole.createMany as any).mockResolvedValueOnce({ count: 1 })
    await assignRoleToUser('user-123', 'role-1', 'actor-9')

    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'user-123', roleId: 'role-1', assignedBy: 'actor-9' }],
      skipDuplicates: true,
    })

    expect(invalidateUserPermissions).toHaveBeenCalledWith('user-123')
  })
})

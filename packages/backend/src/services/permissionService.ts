import prisma from './prismaClient'
import redis from '../config/redis'

const PERM_CACHE_TTL = Number(process.env.PERMISSION_CACHE_TTL_SECONDS) || 3600

const permVersionKey = (userId: string) => `permversion:user:${userId}`
const permSetKey = (userId: string, version: string | number) =>
  `permset:user:${userId}:v${version}`

/**
 * Return effective permission names for a user.
 * Uses Redis cache keyed by permversion to allow inexpensive invalidation.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!userId) return []

  // get version (default 1)
  let version = await redis.get(permVersionKey(userId))
  if (!version) {
    version = '1'
    await redis.set(permVersionKey(userId), version)
  }

  const cacheKey = permSetKey(userId, version)
  const cached = await redis.get(cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // fallthrough to DB
    }
  }

  // fetch from DB: userRoles -> role -> rolePermissions -> permission
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  })

  const permSet = new Set<string>()
  for (const ur of userRoles) {
    const rps = ur.role?.rolePermissions ?? []
    for (const rp of rps) {
      if (rp.permission?.name) permSet.add(rp.permission.name)
    }
  }

  const perms = Array.from(permSet)
  await redis.set(cacheKey, JSON.stringify(perms), 'EX', PERM_CACHE_TTL)
  return perms
}

/**
 * Invalidate permission cache for a user by bumping the permversion.
 * This avoids needing to enumerate and delete cache keys.
 */
export async function invalidateUserPermissions(userId: string): Promise<void> {
  if (!userId) return
  await redis.incr(permVersionKey(userId))
}

/**
 * Seed builtin permissions & roles.
 * idempotent: safe to run multiple times.
 */
export async function seedBuiltinPermissionsAndRoles() {
  const builtinPermissions = [
    'emissions.create',
    'emissions.read',
    'emissions.update',
    'emissions.delete',
    'audit.read',
    'users.manage',
    'roles.manage',
  ]

  const builtinRoles: { name: string; description?: string; permissions: string[] }[] = [
    { name: 'ADMIN', description: 'Full access', permissions: builtinPermissions },
    {
      name: 'DATA_ENTRY',
      description: 'Create and manage emissions',
      permissions: ['emissions.create', 'emissions.read', 'emissions.update'],
    },
    { name: 'VIEWER', description: 'Read-only access', permissions: ['emissions.read'] },
    { name: 'AUDITOR', description: 'View emissions and audits', permissions: ['emissions.read', 'audit.read'] },
  ]

  // Ensure permissions exist
  for (const pname of builtinPermissions) {
    await prisma.permission.upsert({
      where: { name: pname },
      update: {},
      create: { name: pname, description: undefined },
    })
  }

  // Ensure roles exist and attach permissions
  for (const r of builtinRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description ?? null, isBuiltin: true },
      create: { name: r.name, description: r.description ?? null, isBuiltin: true },
    })

    for (const pname of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: pname } })
      if (!perm) continue
      // create relation if not exists
      try {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        })
      } catch (e) {
        // ignore duplicate errors
      }
    }
  }
}

export default {
  getUserPermissions,
  invalidateUserPermissions,
  seedBuiltinPermissionsAndRoles,
}

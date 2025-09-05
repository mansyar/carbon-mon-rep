import prisma from './prismaClient'
import {
  validatePassword,
  hashPassword,
  comparePassword,
  passwordValidationMessage,
} from '../utils/password'
import { writeAudit } from './auditService'
import { invalidateUserPermissions } from './permissionService'

/**
 * Create a new user and optionally assign roles.
 */
export async function createUser(
  input: {
    username: string
    password: string
    roles?: string[] // array of role IDs (optional)
  },
  actorId?: string
) {
  const username = input.username?.trim()
  if (!username) {
    throw new Error('username is required')
  }
  if (username.length > 50) {
    throw new Error('username must be 50 characters or fewer')
  }

  if (!validatePassword(input.password)) {
    throw new Error(passwordValidationMessage())
  }

  // Ensure username is unique
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    throw new Error('username already exists')
  }

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
    },
  })

  // Assign roles if provided (userRoles entries)
  if (input.roles && input.roles.length > 0) {
    const createRoles = input.roles.map((roleId) => ({
      roleId,
      userId: user.id,
      assignedBy: actorId ?? null,
    }))
    // Bulk create userRoles
    await prisma.userRole.createMany({
      data: createRoles,
      skipDuplicates: true,
    })
  }

  // Audit: user created
  await writeAudit(actorId ?? user.id, 'user.create', 'user', user.id, null)

  return {
    id: user.id,
    username: user.username,
    created_at: user.createdAt.toISOString(),
  }
}

/**
 * Verify credentials for username/password.
 * Writes audit events for success/failure.
 */
export async function verifyCredentials(username: string, rawPassword: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    // write audit for login failure (no user)
    await writeAudit(null, 'auth.login_failure', 'user', null, { username })
    return null
  }

  const ok = await comparePassword(rawPassword, user.passwordHash)
  if (!ok) {
    await writeAudit(user.id, 'auth.login_failure', 'user', user.id, null)
    return null
  }

  await writeAudit(user.id, 'auth.login_success', 'user', user.id, null)

  return user
}

/**
 * Fetch user roles and effective permissions.
 * Returns object: { roles: RoleDTO[], permissions: string[] }
 */
export async function getUserWithRolesAndPermissions(userId: string) {
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

  const roles = userRoles.map((ur) => {
    const perms =
      ur.role.rolePermissions?.map((rp) => rp.permission.name).filter(Boolean) ??
      []
    return {
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description ?? undefined,
      is_builtin: ur.role.isBuiltin,
      permissions: perms,
      created_at: ur.role.createdAt.toISOString(),
      updated_at: ur.role.updatedAt.toISOString(),
    }
  })

  // Union permissions
  const permSet = new Set<string>()
  for (const r of roles) {
    for (const p of r.permissions) {
      permSet.add(p)
    }
  }

  return {
    roles,
    permissions: Array.from(permSet),
  }
}

/**
 * Helper to assign a role to a user and invalidate caches / audit.
 */
export async function assignRoleToUser(userId: string, roleId: string, actorId?: string) {
  await prisma.userRole.createMany({
    data: [{ userId, roleId, assignedBy: actorId ?? null }],
    skipDuplicates: true,
  })

  // Invalidate permission cache for user so changes are picked up immediately
  try {
    await invalidateUserPermissions(userId)
  } catch (e) {
    // don't fail role assignment if cache invalidation fails; log on server side if needed
    console.error('Failed to invalidate permission cache for user', userId, e)
  }

  // Audit role assignment
  await writeAudit(actorId ?? null, 'role.assign', 'user', userId, { roleId })
}

export default {
  createUser,
  verifyCredentials,
  getUserWithRolesAndPermissions,
  assignRoleToUser,
}

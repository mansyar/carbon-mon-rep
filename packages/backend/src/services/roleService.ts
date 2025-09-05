import prisma from './prismaClient'
import permissionService from './permissionService'
import { invalidateUserPermissions } from './permissionService'

export async function listRoles() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    is_builtin: r.isBuiltin,
    permissions: r.rolePermissions?.map((rp) => rp.permission.name).filter(Boolean) ?? [],
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))
}

export async function assignRoleToUser(userId: string, roleId: string, actorId?: string) {
  await prisma.userRole.createMany({
    data: [{ userId, roleId, assignedBy: actorId ?? null }],
    skipDuplicates: true,
  })

  // Invalidate permission cache
  await invalidateUserPermissions(userId)

  // Audit is handled by userService.assignRoleToUser which already writes an audit entry
}

export default {
  listRoles,
  assignRoleToUser,
}

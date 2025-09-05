import express from 'express'
import authenticate from '../middleware/authenticate'
import requirePermission from '../middleware/requirePermission'
import userService from '../services/userService'
import roleService from '../services/roleService'
import { writeAudit } from '../services/auditService'

const router = express.Router()

/**
 * Create user
 * POST /api/users
 * Body: { username, password, roles?: string[] }
 * Requires users.manage permission
 */
router.post(
  '/',
  authenticate,
  requirePermission('users.manage'),
  async (req, res) => {
    const actorId = (req as any).user?.id
    const { username, password, roles } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: 'invalid_request' })
    }

    try {
      const created = await userService.createUser({ username, password, roles }, actorId)
      await writeAudit(actorId ?? null, 'user.create', 'user', created.id, { username })
      return res.status(201).json(created)
    } catch (err: any) {
      if (err.message && err.message.includes('username already exists')) {
        return res.status(409).json({ error: 'username_exists' })
      }
      if (err.message && err.message.includes('Password')) {
        return res.status(400).json({ error: 'invalid_password', message: err.message })
      }
      return res.status(500).json({ error: 'internal_error' })
    }
  }
)

/**
 * Assign role to user
 * POST /api/users/:id/roles
 * Body: { roleId: string }
 * Requires roles.manage permission
 */
router.post(
  '/:id/roles',
  authenticate,
  requirePermission('roles.manage'),
  async (req, res) => {
    const actorId = (req as any).user?.id
    const userId = req.params.id
    const { roleId } = req.body || {}
    if (!roleId) return res.status(400).json({ error: 'invalid_request' })

    try {
      // ensure role exists
      const roles = await roleService.listRoles()
      const found = roles.find((r) => r.id === roleId || r.name === roleId)
      if (!found) {
        return res.status(404).json({ error: 'role_not_found' })
      }

      await userService.assignRoleToUser(userId, found.id, actorId)
      await writeAudit(actorId ?? null, 'role.assign', 'user', userId, { roleId: found.id })
      return res.json({ status: 'ok' })
    } catch (err) {
      return res.status(500).json({ error: 'internal_error' })
    }
  }
)

export default router

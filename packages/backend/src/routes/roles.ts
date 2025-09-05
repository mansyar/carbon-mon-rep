import express from 'express'
import authenticate from '../middleware/authenticate'
import requirePermission from '../middleware/requirePermission'
import roleService from '../services/roleService'

const router = express.Router()

/**
 * List roles
 * GET /api/roles
 * Requires roles.manage permission
 */
router.get('/', authenticate, requirePermission('roles.manage'), async (req, res) => {
  try {
    const roles = await roleService.listRoles()
    return res.json(roles)
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router

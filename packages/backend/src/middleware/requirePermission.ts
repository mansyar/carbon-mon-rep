import { Request, Response, NextFunction } from 'express'
import permissionService from '../services/permissionService'
import { AuthenticatedRequest } from './authenticate'

/**
 * Middleware factory that ensures the authenticated user has the required permission.
 * Usage: app.get('/api/x', authenticate, requirePermission('emissions.read'), handler)
 */
export function requirePermission(permission: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const r = req as AuthenticatedRequest
    if (!r.user || !r.user.id) {
      return res.status(401).json({ error: 'unauthenticated' })
    }

    try {
      const perms = await permissionService.getUserPermissions(r.user.id)
      if (!perms || !perms.includes(permission)) {
        return res.status(403).json({ error: 'forbidden' })
      }
      return next()
    } catch (err) {
      // avoid leaking internals
      return res.status(500).json({ error: 'internal_error' })
    }
  }
}

export default requirePermission

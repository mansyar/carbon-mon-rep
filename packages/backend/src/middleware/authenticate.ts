import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AUTH_CONFIG } from '../config/auth'
import { sendError } from '../utils/errors'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; pv?: number }
}

/**
 * Express middleware to verify HS256 access token in Authorization header.
 * On success attaches req.user = { id, pv } and calls next().
 * On failure returns 401.
 *
 * Expected Authorization header: "Bearer <accessToken>"
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || req.header('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return sendError(res, 401, 'unauthenticated')
  }

  const token = auth.slice('Bearer '.length).trim()
    if (!token) {
    return sendError(res, 401, 'unauthenticated')
  }

  try {
    // jsonwebtoken typings can be strict; cast to any for runtime verify
    const payload = (jwt as any).verify(token, AUTH_CONFIG.ACCESS_TOKEN_SECRET, { algorithms: ['HS256'] })
    // payload expected to contain sub (userId) and pv (permissions version)
    const userId = payload && (payload.sub || payload.userId)
    const pv = payload && (payload.pv ?? undefined)
    if (!userId) {
      return sendError(res, 401, 'unauthenticated')
    }
    req.user = { id: String(userId), pv: typeof pv === 'number' ? pv : undefined }
    return next()
  } catch (err) {
    return sendError(res, 401, 'unauthenticated')
  }
}

export default authenticate

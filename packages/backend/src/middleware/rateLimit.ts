import { Request, Response, NextFunction } from 'express'
import redis from '../config/redis'

/**
 * Simple Redis-backed fixed-window rate limiter.
 * Usage:
 *   app.post('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10, keyPrefix: 'login' }), handler)
 *
 * Keying:
 *  - By default uses req.ip
 *  - If req.body.username exists, also rate-limits per username to reduce credential stuffing impact
 */
export function rateLimit(opts: { windowMs?: number; max: number; keyPrefix?: string }) {
  const windowMs = opts.windowMs ?? 15 * 60 * 1000
  const max = opts.max
  const prefix = opts.keyPrefix || 'rl'

  const windowSeconds = Math.ceil(windowMs / 1000)

  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const ip = (req.ip || req.header('x-forwarded-for') || 'unknown').toString()
      const username = (req as any).body?.username
      const keys = []

      // Primary key: per-IP
      keys.push(`${prefix}:ip:${ip}`)

      // Secondary key: per-username if present
      if (typeof username === 'string' && username.trim().length > 0) {
        const uname = username.trim().toLowerCase()
        keys.push(`${prefix}:user:${uname}`)
      }

      // Evaluate all keys; if any is over limit, block
      for (const k of keys) {
        const curr = await redis.incr(k)
        if (curr === 1) {
          await redis.expire(k, windowSeconds)
        }
        if (curr > max) {
          // Return 429 with simple retry-after header
          res.setHeader('Retry-After', String(windowSeconds))
          return res.status(429).json({ error: 'rate_limited' })
        }
      }

      return next()
    } catch (err) {
      // On Redis error allow the request to proceed but log server-side
      // console.error('rateLimit error', err)
      return next()
    }
  }
}

export default rateLimit

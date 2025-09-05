import prisma from './prismaClient'
import redis from '../config/redis'
import jwt from 'jsonwebtoken'
import { randomBytes, createHash, randomUUID } from 'crypto'
import { AUTH_CONFIG } from '../config/auth'

/**
 * Prefer explicit runtime env overrides (used in tests). Fallback to centralized config.
 * REFRESH_TOKEN_TTL_SECONDS prefers process.env if set, otherwise uses AUTH_CONFIG.
 */
const REFRESH_TOKEN_TTL_SECONDS = (() => {
  const secs = Number(process.env.REFRESH_TOKEN_EXPIRES_SECONDS)
  if (!Number.isNaN(secs) && secs > 0) return secs
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS)
  if (!Number.isNaN(days) && days > 0) return days * 24 * 3600
  return Number(AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_SECONDS)
})()

/**
 * Hash helper for refresh tokens (sha256 hex)
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Sign HS256 access token. Payload contains:
 * - sub: userId
 * - pv: permissions version (optional numeric)
 *
 * NOTE: read secret and ttl at runtime so tests can override env vars before importing modules.
 */
export function signAccessToken(userId: string, permissionsVersion?: number) {
  const payload: Record<string, unknown> = {
    sub: userId,
    pv: permissionsVersion ?? 0,
  }
  // read secret/ttl at call time (avoids module-load caching issues in tests)
  const secret = process.env.ACCESS_TOKEN_SECRET || AUTH_CONFIG.ACCESS_TOKEN_SECRET
  const ttl = process.env.ACCESS_TOKEN_TTL || AUTH_CONFIG.ACCESS_TOKEN_TTL
  // jsonwebtoken typings vary across versions; cast to any to avoid overload issues
  return (jwt as any).sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: ttl,
  })
}

/**
 * Create a new refresh session. Stores hashed token in DB and a Redis key for quick revocation-checking.
 * Returned refreshToken (raw) is formatted as: {sessionId}.{secret} where secret is base64url
 */
export async function generateRefreshSession(userId: string) {
  const sessionId = randomUUID()
  const secret = randomBytes(48).toString('base64url')
  const rawToken = `${sessionId}.${secret}`
  const hashed = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)

  // Persist minimal session record in DB
  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId,
      refreshTokenHash: hashed,
      expiresAt,
    },
  })

  // Store in Redis for fast revocation checks (key expires automatically)
  const redisKey = `refreshsession:${sessionId}`
  const meta = JSON.stringify({
    userId,
    refreshTokenHash: hashed,
    expiresAt: expiresAt.toISOString(),
  })
  await redis.set(redisKey, meta, 'EX', REFRESH_TOKEN_TTL_SECONDS)

  return {
    sessionId,
    refreshToken: rawToken,
    expiresAt: expiresAt.toISOString(),
  }
}

/**
 * Verify a raw refresh token. Returns session info or null.
 * Validation flow:
 *  - parse sessionId from token
 *  - try Redis key, fall back to DB
 *  - compare hashed(raw) with stored hash
 *  - ensure not revoked and not expired
 */
export async function verifyRefreshToken(rawToken: string) {
  if (!rawToken) return null
  const [sessionId] = rawToken.split('.')
  if (!sessionId) return null
  const redisKey = `refreshsession:${sessionId}`

  // Try Redis first
  const cached = await redis.get(redisKey)
  let record: { userId: string; refreshTokenHash: string; expiresAt: string } | null = null
  if (cached) {
    try {
      record = JSON.parse(cached)
    } catch {
      record = null
    }
  }

  // If missing in redis, check DB
  if (!record) {
    const dbRec = await prisma.refreshSession.findUnique({ where: { id: sessionId } })
    if (!dbRec) return null
    // Check revoked
    if (dbRec.revokedAt) return null
    record = {
      userId: dbRec.userId,
      refreshTokenHash: dbRec.refreshTokenHash,
      expiresAt: dbRec.expiresAt.toISOString(),
    }
    // repopulate redis for next time (set TTL based on expiresAt)
    const ttl = Math.max(0, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000))
    if (ttl > 0) {
      await redis.set(redisKey, JSON.stringify(record), 'EX', ttl)
    }
  }

  // Compare hashes
  const hashed = hashToken(rawToken)
  if (hashed !== record.refreshTokenHash) return null

  // Check expiry
  if (new Date(record.expiresAt).getTime() <= Date.now()) return null

  return {
    sessionId,
    userId: record.userId,
    expiresAt: record.expiresAt,
  }
}

/**
 * Rotate a refresh token: validate old token, create new session, revoke old session.
 * Returns { accessToken, refreshToken }
 */
export async function rotateRefreshToken(oldRawToken: string, permissionsVersion?: number) {
  const info = await verifyRefreshToken(oldRawToken)
  if (!info) {
    throw new Error('Invalid refresh token')
  }

  // Create new session
  const newSession = await generateRefreshSession(info.userId)

  // Revoke old session (mark revokedAt and replacedBySessionId in DB) and delete redis key
  const [oldSessionId] = oldRawToken.split('.')
  await prisma.refreshSession.update({
    where: { id: oldSessionId },
    data: {
      revokedAt: new Date(),
      replacedBySessionId: newSession.sessionId,
    },
  })
  await redis.del(`refreshsession:${oldSessionId}`)

  // Issue access token
  const accessToken = signAccessToken(info.userId, permissionsVersion)

  return {
    accessToken,
    refreshToken: newSession.refreshToken,
    expiresAt: newSession.expiresAt,
  }
}

/**
 * Revoke a refresh session by sessionId (or raw token).
 */
export async function revokeRefreshSessionById(sessionId: string) {
  await prisma.refreshSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  await redis.del(`refreshsession:${sessionId}`)
}

/**
 * Convenience: revoke by raw token string.
 */
export async function revokeRefreshSessionByToken(rawToken: string) {
  const [sessionId] = rawToken.split('.')
  if (!sessionId) return
  await revokeRefreshSessionById(sessionId)
}

export default {
  signAccessToken,
  generateRefreshSession,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshSessionById,
  revokeRefreshSessionByToken,
  hashToken,
}

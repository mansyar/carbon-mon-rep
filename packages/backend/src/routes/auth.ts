import express from 'express'
import rateLimit from '../middleware/rateLimit'
import userService from '../services/userService'
import tokenService from '../services/tokenService'
import { writeAudit } from '../services/auditService'
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate'

const router = express.Router()

const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  keyPrefix: 'login',
})

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'invalid_request' })
  }

  try {
    const user = await userService.verifyCredentials(username, password)
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials' })
    }

    // issue tokens
    const accessToken = tokenService.signAccessToken(user.id)
    const refresh = await tokenService.generateRefreshSession(user.id)

    // verifyCredentials already writes audit for success; still return tokens
    return res.json({
      accessToken,
      refreshToken: refresh.refreshToken,
      tokenType: 'Bearer',
      expiresAt: refresh.expiresAt,
    })
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' })
  }
})

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'invalid_request' })

  try {
    const rotated = await tokenService.rotateRefreshToken(refreshToken)
    // record audit
    // attempt to get userId from rotated access token payload is unnecessary; rotation used original token to find user
    return res.json({
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresAt: rotated.expiresAt,
      tokenType: 'Bearer',
    })
  } catch (err) {
    return res.status(401).json({ error: 'invalid_refresh_token' })
  }
})

/**
 * Revoke a refresh token. Authenticated caller required.
 * Body: { refreshToken: string }
 */
router.post('/revoke', authenticate, async (req: AuthenticatedRequest, res) => {
  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'invalid_request' })

  try {
    await tokenService.revokeRefreshSessionByToken(refreshToken)
    await writeAudit(req.user?.id ?? null, 'auth.refresh_revoke', 'refresh_session', null, { token: 'revoked' })
    return res.json({ status: 'ok' })
  } catch (err) {
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router

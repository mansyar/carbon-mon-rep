process.env.ACCESS_TOKEN_SECRET = 'test_access_secret'

import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signAccessToken, hashToken } from '../../src/services/tokenService'

describe('tokenService (unit)', () => {
  it('signAccessToken signs an HS256 JWT containing sub and pv', () => {
    const userId = 'user-123'
    const token = signAccessToken(userId, 7)
    expect(typeof token).toBe('string')

    const payload: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, {
      algorithms: ['HS256'],
    }) as any

    expect(payload).toBeTruthy()
    expect(payload.sub).toBe(userId)
    expect(payload.pv).toBe(7)
  })

  it('hashToken returns stable hex for same input and differs for different inputs', () => {
    const a = 'session.abcdef'
    const b = 'session.ghijkl'
    const ha = hashToken(a)
    const hb = hashToken(b)
    const ha2 = hashToken(a)
    expect(typeof ha).toBe('string')
    expect(ha).toHaveLength(64) // sha256 hex length
    expect(ha).toBe(ha2)
    expect(ha).not.toBe(hb)
  })
})

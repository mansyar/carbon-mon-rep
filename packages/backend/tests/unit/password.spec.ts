import { describe, it, expect } from 'vitest'
import { validatePassword, passwordValidationMessage, hashPassword, comparePassword } from '../../src/utils/password'

describe('password utils', () => {
  it('validatePassword should accept valid passwords', () => {
    const valid = 'Abcdef1!'
    expect(validatePassword(valid)).toBe(true)
  })

  it('validatePassword should reject invalid passwords', () => {
    const cases = [
      'abcdefg1!', // no uppercase
      'Abcdefgh!', // no digit
      'Abcdef11',  // no symbol
      'Short1!'    // too short
    ]
    expect(validatePassword('Abcdef1!')).toBe(true)
    for (const p of cases) {
      expect(validatePassword(p)).toBe(false)
    }
  })

  it('passwordValidationMessage returns a helpful message', () => {
    const msg = passwordValidationMessage()
    expect(msg).toContain('Password')
  })

  it('hashPassword and comparePassword should work', async () => {
    const raw = 'Str0ngP@ssw0rd!'
    const hashed = await hashPassword(raw)
    expect(typeof hashed).toBe('string')
    const ok = await comparePassword(raw, hashed)
    expect(ok).toBe(true)
    const wrong = await comparePassword('wrong-password', hashed)
    expect(wrong).toBe(false)
  })
})

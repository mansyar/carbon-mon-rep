/**
 * Auth configuration and derived values.
 * Centralizes TTLs, secrets and related constants used across services.
 */

const parseIntOr = (v: string | undefined, fallback: number) =>
  !v ? fallback : Number(v)

const parseMaybeNumber = (v: string | undefined) =>
  v ? Number(v) : undefined

const refreshSecondsFromEnv = (): number => {
  const seconds = parseMaybeNumber(process.env.REFRESH_TOKEN_EXPIRES_SECONDS)
  if (seconds && !Number.isNaN(seconds)) return seconds
  const days = parseMaybeNumber(process.env.REFRESH_TOKEN_EXPIRES_DAYS)
  if (days && !Number.isNaN(days)) return Math.floor(days * 24 * 3600)
  return 30 * 24 * 3600 // default 30 days
}

/**
 * Exported configuration object consumed by services/middleware.
 * Values are deliberately tolerant of multiple env var names for backward compatibility.
 */
export const AUTH_CONFIG = {
  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-access-secret',
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',

  // Refresh token lifetime (seconds)
  REFRESH_TOKEN_EXPIRES_SECONDS: refreshSecondsFromEnv(),

  // Bcrypt cost factor
  BCRYPT_SALT_ROUNDS: parseIntOr(process.env.BCRYPT_SALT_ROUNDS, 12),

  // Password policy
  PASSWORD_POLICY: {
    MIN_LENGTH: parseIntOr(process.env.PASSWORD_POLICY_MIN_LENGTH, 8),
    // Default enforced regex: at least one uppercase, one digit, one special char, min length 8
    REGEX: new RegExp(
      process.env.PASSWORD_POLICY_REGEX ||
        '^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'
    )
  },

  // Rate limit defaults for auth endpoints (login)
  RATE_LIMIT_WINDOW_MS: parseIntOr(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  RATE_LIMIT_MAX: parseIntOr(process.env.RATE_LIMIT_MAX, 10),

  // Token revocation store selection (redis|db)
  TOKEN_REVOKE_STORE: process.env.TOKEN_REVOKE_STORE || 'db'
} as const

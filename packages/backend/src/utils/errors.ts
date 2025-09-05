import type { Response } from 'express'

export interface ErrorResponse {
  error: string
  message?: string
  details?: unknown
}

/**
 * Create a standardized error response object.
 */
export const createErrorResponse = (
  error: string,
  message?: string,
  details?: unknown
): ErrorResponse => {
  const res: ErrorResponse = { error }
  if (message) res.message = message
  if (details) res.details = details
  return res
}

/**
 * Convenience helper to send a JSON error response with an HTTP status code.
 */
export const sendError = (res: Response, status: number, error: string, message?: string, details?: unknown) => {
  res.status(status).json(createErrorResponse(error, message, details))
}

/**
 * Common auth/error codes used across the app.
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_REVOKED: 'token_revoked',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  INTERNAL_SERVER_ERROR: 'internal_server_error'
} as const

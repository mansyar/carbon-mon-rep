import bcrypt from "bcryptjs";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Validate password against project policy:
 * - Min 8 chars
 * - At least 1 uppercase
 * - At least 1 digit
 * - At least 1 symbol
 */
export function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function passwordValidationMessage(): string {
  return "Password must be at least 8 characters long, include 1 uppercase letter, 1 digit and 1 symbol.";
}

/**
 * Hash a password using bcryptjs.
 * Salt rounds configurable via PASSWORD_SALT_ROUNDS env (default 10).
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 10;
  return bcrypt.hash(password, rounds);
}

/**
 * Compare raw password with stored hash.
 */
export async function comparePassword(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

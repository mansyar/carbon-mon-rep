import { createPrismaClient } from '../../src/services/prismaClient'
import permissionService from '../../src/services/permissionService'
import redis from '../../src/config/redis'

/**
 * Ensure the test database is reachable and builtin roles/permissions are seeded.
 * Returns an initialized Prisma client instance for use in tests.
 */
export async function ensureTestDb() {
  const prisma = createPrismaClient()
  // Connect (prisma client will lazily connect on first query, but explicit connect is fine)
  try {
    await prisma.$connect()
  } catch (e) {
    // rethrow with clearer message
    throw new Error(`Failed to connect to test database: ${(e as Error).message}`)
  }

  // Seed builtin permissions & roles (idempotent)
  await permissionService.seedBuiltinPermissionsAndRoles()

  // Ensure basic redis connectivity if REDIS_URL provided (not required)
  if (process.env.REDIS_URL) {
    try {
      await redis.ping()
    } catch (e) {
      console.warn('Warning: unable to reach Redis from tests:', (e as Error).message)
    }
  }

  return prisma
}

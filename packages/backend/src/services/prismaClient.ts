import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

/**
 * Create (or return existing) PrismaClient instance.
 * Exported factory simplifies testing and long-running dev processes.
 */
export function createPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()

    // Graceful shutdown in long-running dev processes (e.g. bun run --watch)
    if (typeof process !== 'undefined' && process && typeof process.on === 'function') {
      const shutdown = async () => {
        try {
          await prisma?.$disconnect()
          // eslint-disable-next-line no-process-exit
          process.exit(0)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Error during prisma disconnect', e)
          // eslint-disable-next-line no-process-exit
          process.exit(1)
        }
      }

      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
      // Handle nodemon/ts-node restarts in some environments
      process.on('beforeExit', async () => {
        await prisma?.$disconnect()
      })
    }
  }
  return prisma
}

// Default export kept for backwards compatibility
const defaultPrisma = createPrismaClient()
export default defaultPrisma

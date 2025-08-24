import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Graceful shutdown in long-running dev processes (e.g. bun run --watch)
if (typeof process !== 'undefined' && process && typeof process.on === 'function') {
  const shutdown = async () => {
    try {
      await prisma.$disconnect()
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
    await prisma.$disconnect()
  })
}

export default prisma

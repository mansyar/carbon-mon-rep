import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Lightweight idempotent admin seeder for production.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=verysecure bun run scripts/seed_admin.ts
 *
 * Notes:
 * - This script intentionally does not create sample data.
 * - It upserts a user by email/username and assigns the built-in ADMIN role if present.
 * - Do NOT commit real secrets to the repo. Use environment injection for production.
 */

const ADMIN_USERNAME = process.env.SEED_ADMIN_EMAIL || process.env.SEED_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error('SEED_ADMIN_PASSWORD must be provided when running scripts/seed_admin.ts')
  process.exit(1)
}

async function main() {
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD!, Number(process.env.BCRYPT_SALT_ROUNDS) || 12)

  // Upsert user
  const user = await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {
      passwordHash,
      updatedAt: new Date(),
    },
    create: {
      username: ADMIN_USERNAME,
      passwordHash,
    },
  })
  console.log(`Upserted admin user: ${user.username} (${user.id})`)

  // Find ADMIN role
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    console.warn('ADMIN role not found. If you rely on RBAC builtin roles, run the roles seeding step first.')
    return
  }

  // Assign role via userRole (idempotent using skipDuplicates)
  try {
    await prisma.userRole.createMany({
      data: [{ userId: user.id, roleId: adminRole.id, assignedBy: null }],
      skipDuplicates: true,
    })
    console.log(`Assigned role ADMIN to user ${user.username}`)
  } catch (e) {
    console.error('Failed to assign ADMIN role:', e)
  }
}

main()
  .catch((e) => {
    console.error('seed_admin error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

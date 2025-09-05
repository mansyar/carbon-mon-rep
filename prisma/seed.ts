import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const p = prisma as any

/**
 * Idempotent seed:
 * - Upsert an admin user (by username)
 * - Upsert a default site (by fixed id)
 * - Upsert sample emissions (by fixed ids)
 * - Upsert a CsvMapping and UploadJob (by fixed ids)
 * - Seed builtin permissions & roles and assign ADMIN role to admin user
 *
 * This seed uses deterministic UUIDs for resources so repeated runs are safe.
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD=secret npm run prisma:seed
 * If SEED_ADMIN_PASSWORD is not provided the default password "secret" is used.
 * The password is hashed with bcrypt at seed time.
 */

const SITE_ID = '00000000-0000-0000-0000-000000000001'
const EMISSION_IDS = [
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
]
const CSV_MAPPING_ID = '00000000-0000-0000-000000000201'
const UPLOAD_JOB_ID = '00000000-0000-0000-0000-000000000301'

// Admin password for seed (env or default)
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'secret'
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10)

async function seedPermissionsAndRoles() {
  const builtinPermissions = [
    'emissions.create',
    'emissions.read',
    'emissions.update',
    'emissions.delete',
    'audit.read',
    'users.manage',
    'roles.manage',
  ]

  const builtinRoles: { name: string; description?: string; permissions: string[] }[] = [
    { name: 'ADMIN', description: 'Full access', permissions: builtinPermissions },
    {
      name: 'DATA_ENTRY',
      description: 'Create and manage emissions',
      permissions: ['emissions.create', 'emissions.read', 'emissions.update'],
    },
    { name: 'VIEWER', description: 'Read-only access', permissions: ['emissions.read'] },
    { name: 'AUDITOR', description: 'View emissions and audits', permissions: ['emissions.read', 'audit.read'] },
  ]

  // Ensure permissions exist
  for (const pname of builtinPermissions) {
    await prisma.permission.upsert({
      where: { name: pname },
      update: {},
      create: { name: pname, description: undefined },
    })
  }

  // Ensure roles exist and attach permissions
  for (const r of builtinRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description ?? null, isBuiltin: true },
      create: { name: r.name, description: r.description ?? null, isBuiltin: true },
    })

    for (const pname of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: pname } })
      if (!perm) continue
      // create relation if not exists
      try {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        })
      } catch (e) {
        // ignore duplicate errors
      }
    }
  }

  return
}

async function main() {
  // Admin user (username is unique in schema)
  const admin = await p.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'ADMIN',
      updatedAt: new Date(),
      passwordHash: ADMIN_PASSWORD_HASH,
    },
    create: {
      username: 'admin',
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'ADMIN',
    },
  })
  console.log('Upserted user:', admin.username)
  console.log('Seed admin password (use SEED_ADMIN_PASSWORD to override):', ADMIN_PASSWORD)

  // Seed permissions & roles and ensure ADMIN role exists
  await seedPermissionsAndRoles()
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (adminRole) {
    // assign role to user via UserRole table (idempotent)
    try {
      await prisma.userRole.createMany({
        data: [{ userId: admin.id, roleId: adminRole.id, assignedBy: null }],
        skipDuplicates: true,
      })
      console.log(`Assigned role ADMIN to user ${admin.username}`)
    } catch (e) {
      // ignore
    }
  } else {
    console.warn('ADMIN role not found after seeding roles')
  }

  // Default site (use fixed id so upsert is idempotent)
  const site = await p.site.upsert({
    where: { id: SITE_ID },
    update: {
      name: 'Default Site',
      metadata: {},
    },
    create: {
      id: SITE_ID,
      name: 'Default Site',
      metadata: {},
    },
  })
  console.log('Upserted site:', site.id)

  // Sample emissions
  const sampleEmissions = [
    {
      id: EMISSION_IDS[0],
      siteId: SITE_ID,
      emissionType: 'scope_1',
      value: new Prisma.Decimal('123.456'),
      unit: 'kgCO2e',
      timestamp: new Date('2025-01-01T00:00:00Z'),
      referenceId: 'seed-ref-1',
      createdBy: admin.id,
    },
    {
      id: EMISSION_IDS[1],
      siteId: SITE_ID,
      emissionType: 'scope_2',
      value: new Prisma.Decimal('78.9001'),
      unit: 'kgCO2e',
      timestamp: new Date('2025-01-02T00:00:00Z'),
      referenceId: 'seed-ref-2',
      createdBy: admin.id,
    },
    {
      id: EMISSION_IDS[2],
      siteId: SITE_ID,
      emissionType: 'scope_3',
      value: new Prisma.Decimal('0.005'),
      unit: 'kgCO2e',
      timestamp: new Date('2025-01-03T00:00:00Z'),
      referenceId: 'seed-ref-3',
      createdBy: admin.id,
    },
  ]

  for (const e of sampleEmissions) {
    await p.emission.upsert({
      where: { id: e.id },
      update: {
        value: e.value,
        unit: e.unit,
        emissionType: e.emissionType,
        timestamp: e.timestamp,
        referenceId: e.referenceId,
      },
      create: e,
    })
    console.log('Upserted emission id:', e.id)
  }

  // CsvMapping
  await p.csvMapping.upsert({
    where: { id: CSV_MAPPING_ID },
    update: {
      name: 'default-mapping',
      mapping: {},
    },
    create: {
      id: CSV_MAPPING_ID,
      name: 'default-mapping',
      mapping: {},
    },
  })
  console.log('Upserted CsvMapping:', CSV_MAPPING_ID)

  // UploadJob
  await p.uploadJob.upsert({
    where: { id: UPLOAD_JOB_ID },
    update: {
      status: 'COMPLETED',
    },
    create: {
      id: UPLOAD_JOB_ID,
      userId: admin.id,
      fileUrl: null,
      status: 'COMPLETED',
      insertedCount: sampleEmissions.length,
      failedCount: 0,
    },
  })
  console.log('Upserted UploadJob:', UPLOAD_JOB_ID)
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

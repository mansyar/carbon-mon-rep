import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const p = prisma as any

/**
 * Idempotent seed:
 * - Upsert an admin user (by username)
 * - Upsert a default site (by fixed id)
 * - Upsert sample emissions (by fixed ids)
 * - Upsert a CsvMapping and UploadJob (by fixed ids)
 *
 * This seed uses deterministic UUIDs for resources so repeated runs are safe.
 */

const SITE_ID = '00000000-0000-0000-0000-000000000001'
const EMISSION_IDS = [
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
]
const CSV_MAPPING_ID = '00000000-0000-0000-0000-000000000201'
const UPLOAD_JOB_ID = '00000000-0000-0000-0000-000000000301'

async function main() {
  // Admin user (username is unique in schema)
  const admin = await p.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'ADMIN',
      updatedAt: new Date(),
    },
    create: {
      username: 'admin',
      // NOTE: passwordHash here is a placeholder. Replace with a hashed password for real usage.
      passwordHash: 'seed-placeholder-hash',
      role: 'ADMIN',
    },
  })
  console.log('Upserted user:', admin.username)

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

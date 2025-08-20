import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const entries: Prisma.EmissionCreateInput[] = [
    {
      amount: new Prisma.Decimal('123.456'),
      unit: 'kgCO2e',
      source: 'sample-import',
    },
    {
      amount: new Prisma.Decimal('78.9001'),
      unit: 'kgCO2e',
      source: 'sample-calculation',
    },
    {
      amount: new Prisma.Decimal('0.005'),
      unit: 'kgCO2e',
      source: 'sample-estimate',
    },
  ]

  for (const entry of entries) {
    const created = await prisma.emission.create({ data: entry })
    console.log('Created emission:', { id: created.id, amount: created.amount.toString() })
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

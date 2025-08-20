import prisma from './prismaClient'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const EmissionSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  unit: z.string(),
  source: z.string().optional(),
})

export type EmissionInput = z.infer<typeof EmissionSchema>

export async function listEmissions() {
  return prisma.emission.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createEmission(payload: unknown) {
  const parsed = EmissionSchema.parse(payload)

  const data = {
    amount: new Prisma.Decimal(parsed.amount.toString()),
    unit: parsed.unit,
    source: parsed.source ?? null,
  }

  const created = await prisma.emission.create({ data })
  return created
}

import prisma from './prismaClient'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { EmissionCreateDTO, EmissionDTO } from '../types'
import { ALLOWED_UNITS } from '../config/units'
import { writeAudit } from './auditService'

const EmissionCreateSchema = z.object({
  site_id: z.string().uuid(),
  emission_type: z.string().max(50),
  value: z
    .union([z.string(), z.number()])
    .transform((v) => v.toString())
    .refine(
      (s) => {
        try {
          return new Prisma.Decimal(s).gte(new Prisma.Decimal('0'))
        } catch {
          return false
        }
      },
      { message: 'value must be a decimal >= 0' }
    ),
  unit: z.string().refine((u) => ALLOWED_UNITS.includes(u), {
    message: 'unit must be one of: ' + ALLOWED_UNITS.join(', '),
  }),
  timestamp: z.string().refine((t) => !Number.isNaN(Date.parse(t)), { message: 'timestamp must be ISO 8601' }),
  reference_id: z.string().optional(),
})

export async function listEmissions(filters: object = {}, page = 1, perPage = 20) {
  const take = perPage
  const skip = (page - 1) * perPage

  const [rows, total] = await Promise.all([
    prisma.emission.findMany({
      where: filters as any,
      orderBy: { timestamp: 'desc' },
      take,
      skip,
    }),
    prisma.emission.count({ where: filters as any }),
  ])

  const data: EmissionDTO[] = rows.map((r) => ({
    id: r.id,
    site_id: r.siteId,
    emission_type: r.emissionType,
    value: r.value.toString(),
    unit: r.unit,
    timestamp: r.timestamp.toISOString(),
    reference_id: r.referenceId ?? undefined,
    created_by: r.createdBy ?? undefined,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }))

  return {
    data,
    pagination: {
      total,
      page,
      per_page: perPage,
    },
  }
}

export async function createEmission(payload: unknown, userId?: string): Promise<EmissionDTO> {
  const parsed = EmissionCreateSchema.parse(payload)

  const data = {
    siteId: parsed.site_id,
    emissionType: parsed.emission_type,
    value: new Prisma.Decimal(parsed.value),
    unit: parsed.unit,
    timestamp: new Date(parsed.timestamp),
    referenceId: parsed.reference_id ?? null,
    createdBy: userId ?? null,
  }

  // Prefer a transaction so the emission and its audit row are committed together.
  // If transactions are not available or fail, fall back to best-effort behavior.
  try {
    const created = await prisma.$transaction(async (tx) => {
      const emission = await tx.emission.create({ data })
      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: 'create_emission',
          targetType: 'Emission',
          targetId: emission.id,
          diff: Prisma.JsonNull,
        },
      })
      return emission
    })

    const result: EmissionDTO = {
      id: created.id,
      site_id: created.siteId,
      emission_type: created.emissionType,
      value: created.value.toString(),
      unit: created.unit,
      timestamp: created.timestamp.toISOString(),
      reference_id: created.referenceId ?? undefined,
      created_by: created.createdBy ?? undefined,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    }

    return result
  } catch (txErr) {
    console.error('transactional createEmission failed, falling back to non-transactional flow', txErr)
    // Fallback: create emission, then try to write audit (best-effort)
    const created = await prisma.emission.create({ data })

    try {
      await writeAudit(userId ?? null, 'create_emission', 'Emission', created.id, { new: data })
    } catch (e) {
      console.error('audit write failed', e)
    }

    const result: EmissionDTO = {
      id: created.id,
      site_id: created.siteId,
      emission_type: created.emissionType,
      value: created.value.toString(),
      unit: created.unit,
      timestamp: created.timestamp.toISOString(),
      reference_id: created.referenceId ?? undefined,
      created_by: created.createdBy ?? undefined,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    }

    return result
  }
}

/**
 * Partial update stub for Emission.
 * Accepts the same shape as create for now (full payload). This is a minimal M0 stub.
 */
export async function updateEmission(id: string, payload: unknown, userId?: string): Promise<EmissionDTO> {
  const parsed = EmissionCreateSchema.parse(payload)

  const data: any = {
    siteId: parsed.site_id,
    emissionType: parsed.emission_type,
    value: new Prisma.Decimal(parsed.value),
    unit: parsed.unit,
    timestamp: new Date(parsed.timestamp),
    referenceId: parsed.reference_id ?? null,
    // Do not change createdBy on update
  }

  const updated = await prisma.emission.update({
    where: { id },
    data,
  })

  // write audit row
  try {
    await writeAudit(userId ?? null, 'update_emission', 'Emission', id, { new: data })
  } catch (e) {
    console.error('audit write failed', e)
  }

  return {
    id: updated.id,
    site_id: updated.siteId,
    emission_type: updated.emissionType,
    value: updated.value.toString(),
    unit: updated.unit,
    timestamp: updated.timestamp.toISOString(),
    reference_id: updated.referenceId ?? undefined,
    created_by: updated.createdBy ?? undefined,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  }
}

/**
 * Soft-delete stub: sets deletedAt timestamp and writes audit row.
 */
export async function softDeleteEmission(id: string, userId?: string): Promise<void> {
  await prisma.emission.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  try {
    await writeAudit(userId ?? null, 'soft_delete_emission', 'Emission', id, { deleted: true })
  } catch (e) {
    console.error('audit write failed', e)
  }
}

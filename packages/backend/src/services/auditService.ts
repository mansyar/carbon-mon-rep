import prisma from './prismaClient'
import { Prisma } from '@prisma/client'

export async function writeAudit(
  userId: string | null,
  action: string,
  targetType: string,
  targetId?: string | null,
  diff?: object | null
) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      targetType,
      targetId: targetId ?? null,
      // Prisma expects a Json sentinel for null JSON values
      diff: diff ?? Prisma.JsonNull,
    },
  })
}

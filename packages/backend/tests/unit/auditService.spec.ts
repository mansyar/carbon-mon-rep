import { vi, describe, it, expect, beforeEach } from 'vitest'
vi.mock('../../src/services/prismaClient', () => {
  return {
    __esModule: true,
    default: {
      auditLog: {
        create: vi.fn(),
      },
    },
  }
})

import prisma from '../../src/services/prismaClient'
import { writeAudit } from '../../src/services/auditService'

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writeAudit persists an audit row', async () => {
    ;(prisma.auditLog.create as any).mockResolvedValue({ id: 'a1' })

    await writeAudit('u1', 'action_x', 'Target', 't1', { changed: true })

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        action: 'action_x',
        targetType: 'Target',
        targetId: 't1',
      }),
    })
  })
})

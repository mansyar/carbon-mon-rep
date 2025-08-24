import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
vi.mock('../../src/services/prismaClient', () => {
  return {
    __esModule: true,
    default: {
      emission: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  }
})
vi.mock('../../src/services/auditService', () => {
  return {
    __esModule: true,
    writeAudit: vi.fn(),
  }
})

import prisma from '../../src/services/prismaClient'
import { writeAudit } from '../../src/services/auditService'
import { createEmission, listEmissions } from '../../src/services/emissionService'

describe('emissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createEmission validates and creates an emission and writes audit', async () => {
    ;(prisma.emission.create as any).mockResolvedValue({
      id: 'e1',
      siteId: 's1',
      emissionType: 'scope_1',
      value: { toString: () => '123.45' },
      unit: 'kgCO2e',
      timestamp: new Date('2025-01-01T00:00:00Z'),
      referenceId: null,
      createdBy: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const payload = {
      site_id: '00000000-0000-0000-0000-000000000001',
      emission_type: 'scope_1',
      value: '123.45',
      unit: 'kgCO2e',
      timestamp: '2025-01-01T00:00:00Z',
    }

    const res = await createEmission(payload, 'u1')

    expect(prisma.emission.create).toHaveBeenCalled()
    expect(writeAudit).toHaveBeenCalledWith('u1', 'create_emission', 'Emission', 'e1', expect.any(Object))
    expect(res.id).toBe('e1')
    expect(res.value).toBe('123.45')
  })

  it('listEmissions returns paginated data', async () => {
    const mockRows = [
      {
        id: 'e1',
        siteId: 's1',
        emissionType: 'scope_1',
        value: { toString: () => '10.00' },
        unit: 'kg',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        referenceId: null,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    ;(prisma.emission.findMany as any).mockResolvedValue(mockRows)
    ;(prisma.emission.count as any).mockResolvedValue(1)

    const res = await listEmissions({}, 1, 20)
    expect(prisma.emission.findMany).toHaveBeenCalled()
    expect(res.pagination.total).toBe(1)
    expect(res.data[0].id).toBe('e1')
  })
})

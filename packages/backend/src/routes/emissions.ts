import express from 'express'
import { listEmissions, createEmission } from '../services/emissionService'
import { ZodError } from 'zod'
import authenticate, { AuthenticatedRequest } from '../middleware/authenticate'
import requirePermission from '../middleware/requirePermission'

const router = express.Router()

/**
 * List emissions (requires read permission)
 */
router.get('/', authenticate, requirePermission('emissions.read'), async (_req, res) => {
  try {
    const items = await listEmissions()
    res.json(items)
  } catch (e) {
    console.error('GET /api/emissions error', e)
    res.status(500).json({ error: 'internal_server_error' })
  }
})

/**
 * Create emission (requires create permission) and threads the authenticated user id as createdBy.
 */
router.post('/', authenticate, requirePermission('emissions.create'), async (req: AuthenticatedRequest, res) => {
  try {
    const payload = req.body
    const userId = req.user?.id
    const created = await createEmission(payload, userId)
    res.status(201).json(created)
  } catch (e) {
    if (e instanceof ZodError) {
      return res.status(400).json({ error: 'validation_error', details: e.flatten() })
    }
    console.error('POST /api/emissions error', e)
    res.status(500).json({ error: 'internal_server_error' })
  }
})

export default router

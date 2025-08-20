import express from 'express'
import { listEmissions, createEmission } from '../services/emissionService'

const router = express.Router()

router.get('/', async (_req, res) => {
  try {
    const items = await listEmissions()
    res.json(items)
  } catch (e) {
    console.error('GET /api/emissions error', e)
    res.status(500).json({ error: 'internal_server_error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const payload = req.body
    const created = await createEmission(payload)
    res.status(201).json(created)
  } catch (e) {
    console.error('POST /api/emissions error', e)
    res.status(500).json({ error: 'internal_server_error' })
  }
})

export default router

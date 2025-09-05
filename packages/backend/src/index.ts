import express from 'express'
import bodyParser from 'body-parser'
import authRouter from './routes/auth'
import emissionsRouter from './routes/emissions'
import type { Server } from 'http'

const app = express()

app.use(bodyParser.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

import usersRouter from './routes/users'
import rolesRouter from './routes/roles'

// Auth routes (login / refresh / revoke)
app.use('/api/auth', authRouter)

// User and role management
app.use('/api/users', usersRouter)
app.use('/api/roles', rolesRouter)

app.use('/api/emissions', emissionsRouter)

export function healthCheck() {
  return { status: 'ok' }
}

/**
 * Start the HTTP server and return the Server instance.
 * Default port comes from PORT env or 3000.
 */
export async function startServer(port = Number(process.env.PORT || 3000)): Promise<Server> {
  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Backend listening on http://0.0.0.0:${port}`)
      resolve(server)
    })
    server.on('error', (err) => {
      reject(err)
    })
  })
}

// Auto-start unless running in test environment (allows importing app in tests without binding)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((e) => {
    console.error('Failed to start server', e)
  })
}

export default app

import express from 'express'
import bodyParser from 'body-parser'
import emissionsRouter from './routes/emissions'

const app = express()

app.use(bodyParser.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/emissions', emissionsRouter)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`Backend listening on http://0.0.0.0:${port}`)
})

export default app

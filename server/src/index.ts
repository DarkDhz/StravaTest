import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { syncFromHA } from './sync.js'
import {
  getWeeklyData, getMonthlyData, getYearlyData,
  getRecentActivities, getSummary, getMaintenance,
  resetMaintenance, updateMaintenanceMax,
} from './stats.js'

const PORT = parseInt(process.env.STATS_PORT ?? '3001', 10)
const SYNC_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MS ?? '60000', 10)

const app = express()
app.use(cors())
app.use(express.json())

// ── routes ────────────────────────────────────────────────────────────────────

// All historical/computed stats the frontend needs
app.get('/api/stats', (_req, res) => {
  res.json({
    weeklyData:        getWeeklyData(),
    monthlyData:       getMonthlyData(),
    yearlyData:        getYearlyData(),
    recentActivities:  getRecentActivities(),
    maintenance:       getMaintenance(),
    summary:           getSummary(),
  })
})

// Reset a maintenance component km counter
app.post('/api/maintenance/:component/reset', (req, res) => {
  const ok = resetMaintenance(req.params.component)
  res.status(ok ? 200 : 404).json({ ok })
})

// Update the max km threshold for a maintenance component
app.patch('/api/maintenance/:component', (req, res) => {
  const maxKm = Number(req.body?.maxKm)
  if (!maxKm || maxKm <= 0) {
    res.status(400).json({ error: 'maxKm must be a positive number' })
    return
  }
  const ok = updateMaintenanceMax(req.params.component, maxKm)
  res.status(ok ? 200 : 404).json({ ok })
})

// Manual trigger of HA sync (useful for testing)
app.post('/api/sync', async (_req, res) => {
  await syncFromHA()
  res.json({ ok: true })
})

// Proxy HA through /api so the production Nginx /api proxy can serve it too.
app.use('/api/ha', async (req, res) => {
  const haUrl = process.env.VITE_HA_URL || 'http://192.168.0.91:8123'
  const haToken = process.env.VITE_HA_TOKEN || ''
  const target = `${haUrl}/api${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
  try {
    const haRes = await fetch(target, {
      method: req.method,
      headers: { Authorization: `Bearer ${haToken}`, 'Content-Type': 'application/json' },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })
    res.status(haRes.status)
    const data = await haRes.text()
    res.send(data)
  } catch (e) {
    console.error('[api/ha] error:', e)
    res.status(502).json({ error: 'HA unreachable' })
  }
})

// Proxy Home Assistant REST API to avoid CORS issues in the browser
app.use('/ha-proxy', async (req, res) => {
  const haUrl = process.env.VITE_HA_URL || 'http://192.168.0.91:8123'
  const haToken = process.env.VITE_HA_TOKEN || ''
  const target = `${haUrl}${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
  try {
    const haRes = await fetch(target, {
      method: req.method,
      headers: { Authorization: `Bearer ${haToken}`, 'Content-Type': 'application/json' },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })
    res.status(haRes.status)
    const data = await haRes.text()
    res.send(data)
  } catch (e) {
    console.error('[ha-proxy] error:', e)
    res.status(502).json({ error: 'HA unreachable' })
  }
})

// ── start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] Strava stats API on http://localhost:${PORT}`)
})

// Initial sync, then repeat
syncFromHA().catch(console.error)
setInterval(() => syncFromHA().catch(console.error), SYNC_INTERVAL_MS)
console.log(`[server] HA sync every ${SYNC_INTERVAL_MS / 1000}s`)

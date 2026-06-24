import { config } from 'dotenv'
import { db } from './db.js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
config({ path: resolve(root, '.env') })
config()

const HA_URL = process.env.VITE_HA_URL || 'http://homeassistant.local:8123'
const HA_TOKEN = process.env.VITE_HA_TOKEN || ''

const ENTITIES = {
  name:      'sensor.strava_javier_de_santiago_guillen_ride',
  date:      'sensor.strava_javier_de_santiago_guillen_ride_date',
  distance:  'sensor.strava_javier_de_santiago_guillen_ride_distance',
  time:      'sensor.strava_javier_de_santiago_guillen_ride_moving_time',
  elevation: 'sensor.strava_javier_de_santiago_guillen_ride_elevation_gain',
  speed:     'sensor.strava_javier_de_santiago_guillen_ride_speed',
  power:     'sensor.strava_javier_de_santiago_guillen_ride_power',
  calories:  'sensor.strava_javier_de_santiago_guillen_ride_calories',
}

async function fetchState(entityId: string): Promise<{ state: string; attributes: Record<string, unknown> } | null> {
  try {
    const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return res.json() as Promise<{ state: string; attributes: Record<string, unknown> }>
  } catch {
    return null
  }
}

// "DD/MM/YYYY HH:MM" or ISO → "YYYY-MM-DD"
function parseDate(raw: string): string {
  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]
  return raw
}

// "H:MM:SS" → seconds
function parseTimeSecs(raw: string): number {
  const numeric = Number(raw)
  if (Number.isFinite(numeric)) return numeric
  const parts = raw.split(':').map(Number)
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
  return 0
}

const insertActivity = db.prepare(`
  INSERT OR IGNORE INTO activities (id, name, date, distance, time_secs, elevation, speed, power, calories, type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const addKmToMaintenance = db.prepare(
  `UPDATE maintenance SET km_since_reset = km_since_reset + ?`
)

function recordActivity(p: {
  id: string; name: string; date: string; distance: number
  time_secs: number; elevation: number; speed: number; power: number; calories: number; type: string
}): boolean {
  const result = insertActivity.run(
    p.id, p.name, p.date, p.distance, p.time_secs, p.elevation, p.speed, p.power, p.calories, p.type
  )
  if (Number(result.changes) > 0) {
    addKmToMaintenance.run(p.distance)
    console.log(`[sync] + ${p.name} | ${p.date} | ${p.distance} km`)
    return true
  }
  return false
}

function importRecentActivities(raw: unknown[]) {
  let count = 0
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const a = item as Record<string, unknown>
    const name = String(a['name'] ?? '')
    const dateRaw = String(a['date'] ?? a['start_date'] ?? '')
    if (!dateRaw || dateRaw === 'undefined') continue
    const date = parseDate(dateRaw)
    const distance = parseFloat(String(a['distance'] ?? 0))
    const id = (a['id'] as string | undefined)
      ?? `${date}_${name}_${Math.round(distance * 10)}`
    const ok = recordActivity({
      id, name, date, distance,
      time_secs: parseTimeSecs(String(a['moving_time'] ?? a['movingTime'] ?? '0')),
      elevation: parseFloat(String(a['total_elevation_gain'] ?? a['elevationGain'] ?? 0)),
      speed: parseFloat(String(a['average_speed'] ?? a['averageSpeed'] ?? 0)),
      power: parseFloat(String(a['average_watts'] ?? a['averagePower'] ?? 0)),
      calories: parseFloat(String(a['calories'] ?? 0)),
      type: String(a['type'] ?? 'Ride'),
    })
    if (ok) count++
  }
  if (count > 0) console.log(`[sync] Backfilled ${count} activities from HA recentActivities`)
}

export async function syncFromHA(): Promise<void> {
  if (!HA_TOKEN) return

  const [nameS, dateS, distS, timeS, elevS, speedS, powerS, calS] = await Promise.all(
    Object.values(ENTITIES).map(id => fetchState(id))
  )

  // Bulk-import recentActivities attribute (INSERT OR IGNORE — safe every cycle)
  const recentRaw = nameS?.attributes?.['activities']
  if (Array.isArray(recentRaw) && recentRaw.length > 0) {
    importRecentActivities(recentRaw as unknown[])
  }

  // Record lastActivity if it's new
  if (!nameS || !dateS) return
  const name = nameS.state
  const date = parseDate(dateS.state)
  if (!date || name === 'unknown' || name === 'unavailable') return

  const distance = parseFloat(distS?.state ?? '0') || 0
  const id = `${date}_${name}_${Math.round(distance * 10)}`

  recordActivity({
    id, name, date, distance,
    time_secs: parseTimeSecs(timeS?.state ?? '0'),
    elevation: parseFloat(elevS?.state ?? '0') || 0,
    speed:     parseFloat(speedS?.state ?? '0') || 0,
    power:     parseFloat(powerS?.state ?? '0') || 0,
    calories:  parseFloat(calS?.state ?? '0') || 0,
    type: 'Ride',
  })
}

import { db } from './db.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function isoWeekBounds(): { mon: string; sun: string } {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // Mon=0 … Sun=6
  const mon = new Date(now)
  mon.setDate(now.getDate() - dow)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { mon: toISO(mon), sun: toISO(sun) }
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function safeNum(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

function avgNonZero(values: number[]): number {
  const nz = values.filter(v => v > 0)
  return nz.length ? nz.reduce((a, b) => a + b, 0) / nz.length : 0
}

// ── types matching the frontend's interfaces ──────────────────────────────────

export interface WeeklyBar  { day: string; km: number; elevation: number; speed: number; time: number }
export interface ChartBar   { label: string; km: number; elevation: number; speed: number; time: number }
export interface Maintenance { current: number; max: number }
export interface Summary {
  totalDistance: number; totalTime: string; totalElevation: number
  totalActivities: number; bestDistance: number; bestTime: string
}

interface DBActivity {
  id: string; name: string; date: string; distance: number
  time_secs: number; elevation: number; speed: number; power: number; calories: number; type: string
}

// ── weekly (Mon–Sun of the current ISO week) ─────────────────────────────────

export function getWeeklyData(): WeeklyBar[] {
  const { mon, sun } = isoWeekBounds()

  type DayRow = { date: string; km: number; elevation: number; speed: number | null; time: number }
  const rows = db.prepare(`
    SELECT date,
           SUM(distance)                              AS km,
           SUM(elevation)                             AS elevation,
           AVG(CASE WHEN speed > 0 THEN speed END)    AS speed,
           SUM(time_secs) / 3600.0                    AS time
    FROM activities
    WHERE date BETWEEN ? AND ?
    GROUP BY date
  `).all(mon, sun) as DayRow[]

  const byDate = new Map(rows.map(r => [r.date, r]))

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  return dayNames.map((day, i) => {
    const d = new Date(mon + 'T00:00:00')
    d.setDate(d.getDate() + i)
    const iso = toISO(d)
    const r = byDate.get(iso)
    return {
      day,
      km:        safeNum(r?.km),
      elevation: safeNum(r?.elevation),
      speed:     safeNum(r?.speed),
      time:      safeNum(r?.time),
    }
  })
}

// ── monthly (weeks S1–S4 of the current calendar month) ─────────────────────

export function getMonthlyData(): ChartBar[] {
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  type ActRow = { date: string; distance: number; elevation: number; speed: number; time_secs: number }
  const rows = db.prepare(`
    SELECT date, distance, elevation, speed, time_secs
    FROM activities WHERE date LIKE ?
  `).all(`${monthStr}-%`) as ActRow[]

  const weeks = Array.from({ length: 4 }, (_, i) => ({
    label: `S${i + 1}`, km: 0, elevation: 0, speeds: [] as number[], time: 0,
  }))

  for (const r of rows) {
    const day = parseInt(r.date.slice(8), 10)
    const wi = Math.min(Math.floor((day - 1) / 7), 3)
    weeks[wi]!.km        += safeNum(r.distance)
    weeks[wi]!.elevation += safeNum(r.elevation)
    weeks[wi]!.time      += safeNum(r.time_secs) / 3600
    const s = safeNum(r.speed)
    if (s > 0) weeks[wi]!.speeds.push(s)
  }

  return weeks.map(w => ({
    label: w.label, km: w.km, elevation: w.elevation,
    speed: avgNonZero(w.speeds), time: w.time,
  }))
}

// ── yearly (Jan–Dec of the current year) ─────────────────────────────────────

export function getYearlyData(): ChartBar[] {
  const year = new Date().getFullYear()
  const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  return labels.map((label, i) => {
    const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`
    type AggRow = { km: number; elevation: number; time: number; speed: number | null }
    const r = db.prepare(`
      SELECT
        COALESCE(SUM(distance),          0) AS km,
        COALESCE(SUM(elevation),         0) AS elevation,
        COALESCE(SUM(time_secs) / 3600.0, 0) AS time,
        AVG(CASE WHEN speed > 0 THEN speed END) AS speed
      FROM activities WHERE date LIKE ?
    `).get(`${monthStr}-%`) as AggRow
    return { label, km: safeNum(r.km), elevation: safeNum(r.elevation), speed: safeNum(r.speed), time: safeNum(r.time) }
  })
}

// ── recent activities ─────────────────────────────────────────────────────────

function fmtHMS(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getRecentActivities(limit = 10) {
  const rows = db.prepare(`
    SELECT * FROM activities ORDER BY date DESC, created_at DESC LIMIT ?
  `).all(limit) as unknown as DBActivity[]

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    date: row.date,
    distance: safeNum(row.distance),
    movingTime: fmtHMS(safeNum(row.time_secs)),
    elevationGain: safeNum(row.elevation),
    averageSpeed: safeNum(row.speed),
    averagePower: safeNum(row.power),
    calories: safeNum(row.calories),
    type: row.type,
  }))
}

// ── summary ───────────────────────────────────────────────────────────────────

export function getSummary(): Summary {
  type AggRow = {
    totalDistance: number; totalTimeSecs: number; totalElevation: number
    totalActivities: number; bestDistance: number; bestTimeSecs: number
  }
  const r = db.prepare(`
    SELECT
      COALESCE(SUM(distance),  0) AS totalDistance,
      COALESCE(SUM(time_secs), 0) AS totalTimeSecs,
      COALESCE(SUM(elevation), 0) AS totalElevation,
      COUNT(*)                    AS totalActivities,
      COALESCE(MAX(distance),  0) AS bestDistance,
      COALESCE(MAX(time_secs), 0) AS bestTimeSecs
    FROM activities
  `).get() as AggRow

  const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h ${String(m).padStart(2, '0')}m`
  }

  return {
    totalDistance:   safeNum(r.totalDistance),
    totalTime:       fmtTime(safeNum(r.totalTimeSecs)),
    totalElevation:  safeNum(r.totalElevation),
    totalActivities: safeNum(r.totalActivities),
    bestDistance:    safeNum(r.bestDistance),
    bestTime:        fmtTime(safeNum(r.bestTimeSecs)),
  }
}

// ── maintenance ───────────────────────────────────────────────────────────────

interface MaintenanceRow { component: string; km_since_reset: number; max_km: number; reset_at: string | null }

export function getMaintenance(): Record<string, Maintenance> {
  const rows = db.prepare('SELECT * FROM maintenance').all() as unknown as MaintenanceRow[]
  return Object.fromEntries(
    rows.map(r => [r.component, { current: safeNum(r.km_since_reset), max: safeNum(r.max_km) }])
  )
}

export function resetMaintenance(component: string): boolean {
  const result = db.prepare(
    `UPDATE maintenance SET km_since_reset = 0, reset_at = datetime('now') WHERE component = ?`
  ).run(component)
  return Number(result.changes) > 0
}

export function updateMaintenanceMax(component: string, maxKm: number): boolean {
  const result = db.prepare(
    `UPDATE maintenance SET max_km = ? WHERE component = ?`
  ).run(maxKm, component)
  return Number(result.changes) > 0
}

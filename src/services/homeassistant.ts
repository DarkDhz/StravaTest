import type { HAState, DashboardData, Activity, ChartBar, WeeklyData } from '../types'

export const HA_CONFIG = {
  url: import.meta.env.VITE_HA_URL || 'http://homeassistant.local:8123',
  token: import.meta.env.VITE_HA_TOKEN || '',
}

// Real entity IDs from the HA Strava integration (device: Strava Javier De Santiago Guillén Ride)
export const ENTITY_MAP = {
  lastActivityName:      'sensor.strava_javier_de_santiago_guillen_ride',
  lastActivityDate:      'sensor.strava_javier_de_santiago_guillen_ride_date',
  lastActivityDistance:  'sensor.strava_javier_de_santiago_guillen_ride_distance',
  lastActivityMovingTime:'sensor.strava_javier_de_santiago_guillen_ride_moving_time',
  lastActivityElevation: 'sensor.strava_javier_de_santiago_guillen_ride_elevation_gain',
  lastActivityAvgSpeed:  'sensor.strava_javier_de_santiago_guillen_ride_speed',
  lastActivityAvgPower:  'sensor.strava_javier_de_santiago_guillen_ride_power',
  lastActivityCalories:  'sensor.strava_javier_de_santiago_guillen_ride_calories',
  lastActivityHeartrate: 'sensor.strava_javier_de_santiago_guillen_ride_average_heartrate',
  // Gear total distances (km since gear added to Strava)
  carreteraDistance:     'sensor.strava_javier_de_santiago_guillen_carretera_distance',
  mtbDistance:           'sensor.strava_javier_de_santiago_guillen_mtb_distance',
}

// ── HA helpers ────────────────────────────────────────────────────────────────

async function fetchState(entityId: string): Promise<HAState | null> {
  try {
    const res = await fetch(`/api/ha/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${HA_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      console.warn(`[HA] ${entityId} → HTTP ${res.status}`)
      return null
    }
    return res.json()
  } catch (e) {
    console.warn(`[HA] ${entityId} → fetch error:`, e)
    return null
  }
}

async function fetchMultipleStates(entityIds: string[]): Promise<Record<string, HAState> | null> {
  const results = await Promise.all(entityIds.map(id => fetchState(id)))
  const entries = Object.fromEntries(
    entityIds.map((id, i) => [id, results[i]!]).filter(([, v]) => v !== null)
  )
  return Object.keys(entries).length > 0 ? entries : null
}

function parseNum(state: HAState | undefined, fallback = 0): number {
  if (!state) return fallback
  const n = parseFloat(state.state)
  return isNaN(n) ? fallback : n
}

function parseStr(state: HAState | undefined, fallback = '-'): string {
  return state?.state ?? fallback
}

// Convert seconds to H:MM:SS
function secsToHMS(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Decode Google encoded polyline → [lat, lng][]
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : (result >> 1)
    shift = 0; result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : (result >> 1)
    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

// ── Stats API (SQLite server) ─────────────────────────────────────────────────

interface StatsResponse {
  weeklyData:       WeeklyData[]
  monthlyData:      ChartBar[]
  yearlyData:       ChartBar[]
  recentActivities: Activity[]
  maintenance: {
    chain:          { current: number; max: number }
    tires:          { current: number; max: number }
    brakes:         { current: number; max: number }
    generalService: { current: number; max: number }
  }
  summary: {
    totalDistance:   number
    totalTime:       string
    totalElevation:  number
    totalActivities: number
    bestDistance:    number
    bestTime:        string
  }
}

async function fetchStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch('/api/stats')
    if (!res.ok) return null
    return res.json() as Promise<StatsResponse>
  } catch {
    return null
  }
}

// ── Mock data ─────────────────────────────────────────────────────────────────

export function getMockData(): DashboardData {
  return {
    lastActivity: {
      id: '1',
      name: 'Ruta de mañana',
      date: '26/11/2024 08:12',
      distance: 62.47,
      movingTime: '2:35:42',
      elevationGain: 1102,
      averageSpeed: 24.1,
      averagePower: 178,
      calories: 1862,
      type: 'Ride',
      polyline: [
        [40.6350, -3.8800], [40.6580, -3.8600], [40.6820, -3.8200],
        [40.7050, -3.7700], [40.7200, -3.7200], [40.7100, -3.6800],
        [40.6900, -3.6500], [40.6650, -3.6700], [40.6400, -3.7100],
        [40.6250, -3.7600], [40.6200, -3.8100], [40.6350, -3.8800],
      ],
    },
    recentActivities: [
      { id: '1', name: 'Ruta de mañana',          date: '26/11/2024', distance: 62.47,  movingTime: '2:35:42', elevationGain: 1102, averageSpeed: 24.1, averagePower: 178, calories: 1862, type: 'Ride' },
      { id: '2', name: 'Entrenamiento por la tarde', date: '24/11/2024', distance: 35.21, movingTime: '1:28:15', elevationGain: 420,  averageSpeed: 23.8, averagePower: 165, calories: 980,  type: 'Ride' },
      { id: '3', name: 'Ruta larga',               date: '23/11/2024', distance: 105.80, movingTime: '4:12:11', elevationGain: 2100, averageSpeed: 25.1, averagePower: 185, calories: 2850, type: 'Ride' },
      { id: '4', name: 'Rodaje suave',             date: '20/11/2024', distance: 28.42, movingTime: '1:06:33', elevationGain: 180,  averageSpeed: 25.7, averagePower: 145, calories: 680,  type: 'Ride' },
    ],
    goals: {
      weekly:  { current: 72.4,  target: 100 },
      monthly: { current: 310,   target: 400 },
      yearly:  { current: 2850,  target: 5000 },
    },
    maintenance: {
      chain:          { current: 1250, max: 1500 },
      tires:          { current: 1250, max: 3000 },
      brakes:         { current: 400,  max: 1000 },
      generalService: { current: 1250, max: 5000 },
    },
    summary: {
      totalDistance:   2850,
      totalTime:       '123h 45m',
      totalElevation:  48750,
      totalActivities: 86,
      bestDistance:    142.30,
      bestTime:        '5h 12m',
    },
    weeklyData: [
      { day: 'Lun', km: 0,     elevation: 0,    speed: 0,    time: 0 },
      { day: 'Mar', km: 35.21, elevation: 420,  speed: 23.8, time: 1.47 },
      { day: 'Mié', km: 0,     elevation: 0,    speed: 0,    time: 0 },
      { day: 'Jue', km: 0,     elevation: 0,    speed: 0,    time: 0 },
      { day: 'Vie', km: 0,     elevation: 0,    speed: 0,    time: 0 },
      { day: 'Sáb', km: 62.47, elevation: 1102, speed: 24.1, time: 2.60 },
      { day: 'Dom', km: 10.23, elevation: 180,  speed: 25.7, time: 0.65 },
    ],
    monthlyData: [
      { label: 'S1', km: 85,   elevation: 2100, speed: 24.5, time: 5.3 },
      { label: 'S2', km: 82,   elevation: 1850, speed: 23.9, time: 4.9 },
      { label: 'S3', km: 70.6, elevation: 980,  speed: 24.8, time: 3.5 },
      { label: 'S4', km: 72.4, elevation: 1702, speed: 24.2, time: 4.7 },
    ] as ChartBar[],
    yearlyData: [
      { label: 'Ene', km: 250, elevation: 3750, speed: 23.5, time: 10.4 },
      { label: 'Feb', km: 180, elevation: 2700, speed: 24.1, time: 7.5 },
      { label: 'Mar', km: 320, elevation: 4800, speed: 24.8, time: 13.3 },
      { label: 'Abr', km: 390, elevation: 5850, speed: 25.2, time: 16.3 },
      { label: 'May', km: 360, elevation: 5400, speed: 25.5, time: 15.0 },
      { label: 'Jun', km: 280, elevation: 4200, speed: 24.9, time: 11.7 },
      { label: 'Jul', km: 130, elevation: 1950, speed: 23.8, time: 5.4 },
      { label: 'Ago', km: 170, elevation: 2550, speed: 24.5, time: 7.1 },
      { label: 'Sep', km: 270, elevation: 4050, speed: 25.1, time: 11.3 },
      { label: 'Oct', km: 190, elevation: 2850, speed: 24.3, time: 7.9 },
      { label: 'Nov', km: 310, elevation: 4632, speed: 24.2, time: 12.9 },
      { label: 'Dic', km: 0,   elevation: 0,    speed: 0,    time: 0 },
    ] as ChartBar[],
    monthlyTotal:    310,
    yearlyTotal:     2850,
    weeklyAvgSpeed:  24.2,
  }
}

// ── main export ───────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  const [stats, haStates] = await Promise.all([
    fetchStats(),
    HA_CONFIG.token
      ? fetchMultipleStates(Object.values(ENTITY_MAP))
      : Promise.resolve(null),
  ])

  console.info('[HA] token:', !!HA_CONFIG.token, '| haStates:', haStates ? Object.keys(haStates).length + ' entities' : 'null', '| stats:', !!stats)
  if (!stats && !haStates) {
    console.info('[HA] → mock data')
    return getMockData()
  }

  const mock = getMockData()
  const get = (key: keyof typeof ENTITY_MAP) =>
    haStates?.[ENTITY_MAP[key]] as HAState | undefined

  // Last activity from HA Ride sensor
  let lastActivity: Activity = mock.lastActivity
  if (haStates) {
    const rideState = get('lastActivityName')
    const movingTimeSecs = parseNum(get('lastActivityMovingTime'))
    const encodedPolyline = rideState?.attributes?.polyline as string | undefined
    const power = parseNum(get('lastActivityAvgPower'))

    lastActivity = {
      id:            String(rideState?.attributes?.activity_id ?? '1'),
      name:          parseStr(rideState, 'Última actividad'),
      date:          parseStr(get('lastActivityDate'), '-'),
      distance:      parseNum(get('lastActivityDistance')),
      movingTime:    movingTimeSecs > 0 ? secsToHMS(movingTimeSecs) : '0:00:00',
      elevationGain: parseNum(get('lastActivityElevation')),
      averageSpeed:  parseNum(get('lastActivityAvgSpeed')),
      averagePower:  isNaN(power) ? 0 : power,
      calories:      parseNum(get('lastActivityCalories')),
      type:          (rideState?.attributes?.sport_type as Activity['type']) ?? 'Ride',
      polyline:      encodedPolyline ? decodePolyline(encodedPolyline) : undefined,
    }
  }

  // weekly/monthly/yearly distances: HA Strava integration doesn't expose these,
  // so they come from SQLite stats or mock
  const weeklyKm  = stats ? (stats.weeklyData.reduce((s, d) => s + d.km, 0)) : mock.goals.weekly.current
  const monthlyKm = stats?.summary ? mock.goals.monthly.current : mock.goals.monthly.current
  const yearlyKm  = stats?.summary ? mock.goals.yearly.current  : mock.goals.yearly.current

  const recentActivities: Activity[] =
    (stats?.recentActivities.length ?? 0) > 0
      ? stats!.recentActivities
      : mock.recentActivities

  const summary = stats?.summary ?? mock.summary

  return {
    lastActivity,
    recentActivities,
    goals: {
      weekly:  { current: weeklyKm,  target: mock.goals.weekly.target },
      monthly: { current: monthlyKm, target: mock.goals.monthly.target },
      yearly:  { current: yearlyKm,  target: mock.goals.yearly.target },
    },
    maintenance:  stats?.maintenance  ?? mock.maintenance,
    summary,
    weeklyData:   stats?.weeklyData   ?? mock.weeklyData,
    monthlyData:  stats?.monthlyData  ?? mock.monthlyData,
    yearlyData:   stats?.yearlyData   ?? mock.yearlyData,
    monthlyTotal: monthlyKm,
    yearlyTotal:  yearlyKm,
    weeklyAvgSpeed: stats?.weeklyData
      ? (() => {
          const nonZero = stats.weeklyData.map(d => d.speed ?? 0).filter(s => s > 0)
          return nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0
        })()
      : mock.weeklyAvgSpeed,
  }
}

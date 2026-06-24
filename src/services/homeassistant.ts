import type { HAState, DashboardData, Activity } from '../types'

// Configure these to match your HomeAssistant setup
export const HA_CONFIG = {
  url: import.meta.env.VITE_HA_URL || 'http://homeassistant.local:8123',
  token: import.meta.env.VITE_HA_TOKEN || '',
}

// Entity ID mapping — adjust to match your HA Strava integration entity names
export const ENTITY_MAP = {
  lastActivityName: 'sensor.strava_last_activity_name',
  lastActivityDate: 'sensor.strava_last_activity_start_date',
  lastActivityDistance: 'sensor.strava_last_activity_distance',
  lastActivityMovingTime: 'sensor.strava_last_activity_moving_time',
  lastActivityElevation: 'sensor.strava_last_activity_total_elevation_gain',
  lastActivityAvgSpeed: 'sensor.strava_last_activity_average_speed',
  lastActivityAvgPower: 'sensor.strava_last_activity_average_watts',
  lastActivityCalories: 'sensor.strava_last_activity_calories',
  weeklyDistance: 'sensor.strava_weekly_distance',
  monthlyDistance: 'sensor.strava_monthly_distance',
  yearlyDistance: 'sensor.strava_yearly_distance',
  totalDistance: 'sensor.strava_total_distance',
  totalActivities: 'sensor.strava_total_activities',
  recentActivities: 'sensor.strava_recent_activities',
}

async function fetchState(entityId: string): Promise<HAState | null> {
  try {
    const res = await fetch(`${HA_CONFIG.url}/api/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${HA_CONFIG.token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchMultipleStates(entityIds: string[]): Promise<Record<string, HAState>> {
  const results = await Promise.all(entityIds.map(id => fetchState(id)))
  return Object.fromEntries(
    entityIds.map((id, i) => [id, results[i]!]).filter(([, v]) => v !== null)
  )
}

function parseNum(state: HAState | undefined, fallback = 0): number {
  if (!state) return fallback
  const n = parseFloat(state.state)
  return isNaN(n) ? fallback : n
}

function parseStr(state: HAState | undefined, fallback = '-'): string {
  return state?.state ?? fallback
}

// Mock data used when HA is unavailable or token not set
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
      { id: '1', name: 'Ruta de mañana', date: '26/11/2024', distance: 62.47, movingTime: '2:35:42', elevationGain: 1102, averageSpeed: 24.1, averagePower: 178, calories: 1862, type: 'Ride' },
      { id: '2', name: 'Entrenamiento por la tarde', date: '24/11/2024', distance: 35.21, movingTime: '1:28:15', elevationGain: 420, averageSpeed: 23.8, averagePower: 165, calories: 980, type: 'Ride' },
      { id: '3', name: 'Ruta larga', date: '23/11/2024', distance: 105.80, movingTime: '4:12:11', elevationGain: 2100, averageSpeed: 25.1, averagePower: 185, calories: 2850, type: 'Ride' },
      { id: '4', name: 'Rodaje suave', date: '20/11/2024', distance: 28.42, movingTime: '1:06:33', elevationGain: 180, averageSpeed: 25.7, averagePower: 145, calories: 680, type: 'Ride' },
    ],
    goals: {
      weekly: { current: 72.4, target: 100 },
      monthly: { current: 310, target: 400 },
      yearly: { current: 2850, target: 5000 },
    },
    maintenance: {
      chain: { current: 1250, max: 1500 },
      tires: { current: 1250, max: 3000 },
      brakes: { current: 400, max: 1000 },
      generalService: { current: 1250, max: 5000 },
    },
    summary: {
      totalDistance: 2850,
      totalTime: '123h 45m',
      totalElevation: 48750,
      totalActivities: 86,
      bestDistance: 142.30,
      bestTime: '5:12:45',
    },
    weeklyData: [
      { day: 'Lun', km: 0 },
      { day: 'Mar', km: 35.21 },
      { day: 'Mié', km: 0 },
      { day: 'Jue', km: 0 },
      { day: 'Vie', km: 0 },
      { day: 'Sáb', km: 62.47 },
      { day: 'Dom', km: 10.23 },
    ],
    monthlyTotal: 310,
    yearlyTotal: 2850,
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!HA_CONFIG.token) {
    console.info('[HA] No token set — using mock data')
    return getMockData()
  }

  const entityIds = Object.values(ENTITY_MAP)
  const states = await fetchMultipleStates(entityIds)

  const get = (key: keyof typeof ENTITY_MAP) => states[ENTITY_MAP[key]]

  const weeklyKm = parseNum(get('weeklyDistance'))
  const monthlyKm = parseNum(get('monthlyDistance'))
  const yearlyKm = parseNum(get('yearlyDistance'))

  // Try to get recent activities from the HA attribute if available
  const recentRaw = get('recentActivities')?.attributes?.activities as unknown[]
  const recentActivities = Array.isArray(recentRaw) && recentRaw.length > 0
    ? (recentRaw as Activity[])
    : getMockData().recentActivities

  return {
    lastActivity: {
      id: '1',
      name: parseStr(get('lastActivityName'), 'Última actividad'),
      date: parseStr(get('lastActivityDate'), '-'),
      distance: parseNum(get('lastActivityDistance')),
      movingTime: parseStr(get('lastActivityMovingTime'), '0:00:00'),
      elevationGain: parseNum(get('lastActivityElevation')),
      averageSpeed: parseNum(get('lastActivityAvgSpeed')),
      averagePower: parseNum(get('lastActivityAvgPower')),
      calories: parseNum(get('lastActivityCalories')),
      type: 'Ride',
    },
    recentActivities,
    goals: {
      weekly: { current: weeklyKm, target: 100 },
      monthly: { current: monthlyKm, target: 400 },
      yearly: { current: yearlyKm, target: 5000 },
    },
    maintenance: getMockData().maintenance,
    summary: {
      totalDistance: parseNum(get('totalDistance')),
      totalTime: '-',
      totalElevation: 0,
      totalActivities: parseNum(get('totalActivities')),
      bestDistance: 0,
      bestTime: '-',
    },
    weeklyData: getMockData().weeklyData,
    monthlyTotal: monthlyKm,
    yearlyTotal: yearlyKm,
  }
}


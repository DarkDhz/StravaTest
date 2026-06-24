export interface Activity {
  id: string
  name: string
  date: string
  distance: number       // km
  movingTime: string     // HH:MM:SS
  elevationGain: number  // m
  averageSpeed: number   // km/h
  averagePower: number   // W
  calories: number
  type: 'Ride' | 'Run' | 'Walk' | 'Hike'
  polyline?: [number, number][]
}

export interface Goals {
  weekly: { current: number; target: number }
  monthly: { current: number; target: number }
  yearly: { current: number; target: number }
}

export interface BikeMaintenance {
  chain: { current: number; max: number }
  tires: { current: number; max: number }
  brakes: { current: number; max: number }
  generalService: { current: number; max: number }
}

export interface PerformanceSummary {
  totalDistance: number
  totalTime: string
  totalElevation: number
  totalActivities: number
  bestDistance: number
  bestTime: string
}

export interface WeeklyData {
  day: string
  km: number
  elevation?: number  // metres
  speed?: number      // km/h average
  time?: number       // hours
}

export interface ChartBar {
  label: string
  km: number
  elevation?: number  // metres
  speed?: number      // km/h average
  time?: number       // hours
}

export interface DashboardData {
  lastActivity: Activity
  recentActivities: Activity[]
  goals: Goals
  maintenance: BikeMaintenance
  summary: PerformanceSummary
  weeklyData: WeeklyData[]
  monthlyData: ChartBar[]
  yearlyData: ChartBar[]
  monthlyTotal: number
  yearlyTotal: number
  weeklyAvgSpeed?: number
}

export interface HAState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
}

import { useDashboard } from './hooks/useDashboard'
import { Header } from './components/Header'
import { LastActivity } from './components/LastActivity'
import { ActivityMap } from './components/ActivityMap'
import { Goals } from './components/Goals'
import { RecentActivities } from './components/RecentActivities'
import { KilometersChart } from './components/KilometersChart'
import { BikeMaintenance } from './components/BikeMaintenance'
import { PerformanceSummary } from './components/PerformanceSummary'

export default function App() {
  const { data, loading, refresh } = useDashboard(60_000)

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      <Header onRefresh={refresh} loading={loading} />

      <main className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col gap-3 sm:gap-4 max-w-[1800px] mx-auto w-full">

        {/* Row 1: Last activity | Map | Goals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-1 lg:col-span-1">
            <LastActivity activity={data.lastActivity} />
          </div>
          <div className="sm:col-span-2 lg:col-span-2 min-h-[260px]">
            <ActivityMap activity={data.lastActivity} />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <Goals goals={data.goals} />
          </div>
        </div>

        {/* Row 2: Recent activities | KM chart | Bike maintenance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="sm:col-span-1 lg:col-span-1">
            <RecentActivities activities={data.recentActivities} />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <KilometersChart
              weeklyData={data.weeklyData}
              monthlyData={data.monthlyData}
              yearlyData={data.yearlyData}
              weeklyTotal={data.goals.weekly.current}
              monthlyTotal={data.monthlyTotal}
              yearlyTotal={data.yearlyTotal}
              weeklyAvgSpeed={data.weeklyAvgSpeed}
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <BikeMaintenance maintenance={data.maintenance} />
          </div>
        </div>

        {/* Row 3: Performance summary */}
        <div>
          <PerformanceSummary summary={data.summary} />
        </div>

      </main>
    </div>
  )
}

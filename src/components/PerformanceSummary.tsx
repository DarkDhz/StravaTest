import type { PerformanceSummary as Summary } from '../types'

interface Props {
  summary: Summary
}

interface SummaryItemProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function SummaryItem({ icon, label, value, color }: SummaryItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}22` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-white font-bold text-sm sm:text-base leading-tight">{value}</div>
      </div>
    </div>
  )
}

export function PerformanceSummary({ summary }: Props) {
  return (
    <div className="bg-[#242424] rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4">Resumen de rendimiento</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <SummaryItem
          color="#FC4C02"
          label="Distancia total"
          value={`${summary.totalDistance.toLocaleString('es-ES')} km`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6l9-4 9 4M3 18l9 4 9-4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
        <SummaryItem
          color="#3b82f6"
          label="Tiempo total"
          value={summary.totalTime}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
            </svg>
          }
        />
        <SummaryItem
          color="#a855f7"
          label="Desnivel total"
          value={`${summary.totalElevation.toLocaleString('es-ES')} m`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
        <SummaryItem
          color="#22c55e"
          label="Actividades"
          value={String(summary.totalActivities)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18 20V10M12 20V4M6 20v-6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
        <SummaryItem
          color="#f59e0b"
          label="Mejor distancia"
          value={`${summary.bestDistance.toFixed(2).replace('.', ',')} km`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="6" strokeWidth="2"/>
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" strokeWidth="2"/>
            </svg>
          }
        />
        <SummaryItem
          color="#ef4444"
          label="Mejor tiempo"
          value={summary.bestTime}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>
    </div>
  )
}

import type { Goals as GoalsType } from '../types'

interface Props {
  goals: GoalsType
}

interface GoalRowProps {
  label: string
  current: number
  target: number
  unit: string
  color: string
  icon: React.ReactNode
}

function GoalRow({ label, current, target, unit, color, icon }: GoalRowProps) {
  const pct = Math.min(100, Math.round((current / target) * 100))

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-white font-bold text-base" style={{ color }}>
            {current.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-gray-500 text-xs">/ {target.toLocaleString('es-ES')} {unit}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="text-right text-xs text-gray-500 mt-0.5">{pct}%</div>
      </div>
      <div className="mt-1 p-2 rounded-lg" style={{ backgroundColor: `${color}22` }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
  )
}

export function Goals({ goals }: Props) {
  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Objetivos</div>

      <GoalRow
        label="Esta semana"
        current={goals.weekly.current}
        target={goals.weekly.target}
        unit="km"
        color="#22c55e"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        }
      />

      <GoalRow
        label="Este mes"
        current={goals.monthly.current}
        target={goals.monthly.target}
        unit="km"
        color="#FC4C02"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
          </svg>
        }
      />

      <GoalRow
        label="Este año"
        current={goals.yearly.current}
        target={goals.yearly.target}
        unit="km"
        color="#3b82f6"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeWidth="2"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeWidth="2"/>
            <path d="M4 22h16" strokeWidth="2"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" strokeWidth="2"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" strokeWidth="2"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" strokeWidth="2"/>
          </svg>
        }
      />
    </div>
  )
}

import type { BikeMaintenance as BikeMaintenanceType } from '../types'

interface Props {
  maintenance: BikeMaintenanceType
}

interface MaintenanceRowProps {
  label: string
  current: number
  max: number
  icon: React.ReactNode
}

function MaintenanceRow({ label, current, max, icon }: MaintenanceRowProps) {
  const pct = Math.min(100, Math.round((current / max) * 100))
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f97316' : '#22c55e'

  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[#FC4C02] shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-xs font-medium">{label}</span>
          <span className="text-gray-500 text-xs">
            {current.toLocaleString('es-ES')} / {max.toLocaleString('es-ES')} km
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className="text-right text-xs mt-0.5" style={{ color }}>{pct}%</div>
      </div>
    </div>
  )
}

const WrenchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export function BikeMaintenance({ maintenance }: Props) {
  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mantenimiento de la bici</div>

      <div className="flex flex-col gap-3">
        <MaintenanceRow
          label="Cadena"
          current={maintenance.chain.current}
          max={maintenance.chain.max}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Cubiertas"
          current={maintenance.tires.current}
          max={maintenance.tires.max}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Pastillas de freno"
          current={maintenance.brakes.current}
          max={maintenance.brakes.max}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Revisión general"
          current={maintenance.generalService.current}
          max={maintenance.generalService.max}
          icon={<WrenchIcon />}
        />
      </div>

      <a
        href="#"
        className="mt-1 pt-3 border-t border-[#333] flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#FC4C02] transition-colors"
      >
        VER TODO EL MANTENIMIENTO
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
        </svg>
      </a>
    </div>
  )
}

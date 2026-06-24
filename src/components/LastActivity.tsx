import type { Activity } from '../types'

interface Props {
  activity: Activity
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-400 w-4 shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-white font-semibold text-sm leading-tight">{value}</div>
      </div>
    </div>
  )
}

export function LastActivity({ activity }: Props) {
  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Última actividad</div>
        <div className="text-[#FC4C02]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
          </svg>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeWidth="2"/>
          </svg>
          <h2 className="text-white font-bold text-lg">{activity.name}</h2>
        </div>
        <div className="text-gray-500 text-xs ml-7">{activity.date}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-[#FC4C02]"><path d="M3 12h18M3 6l9-4 9 4M3 18l9 4 9-4" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Distancia"
          value={`${activity.distance.toFixed(2).replace('.', ',')} km`}
        />
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-[#FC4C02]"><circle cx="12" cy="12" r="10" strokeWidth="2"/><polyline points="12 6 12 12 16 14" strokeWidth="2"/></svg>}
          label="Tiempo"
          value={activity.movingTime}
        />
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-[#FC4C02]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Desnivel positivo"
          value={`${activity.elevationGain.toLocaleString('es-ES')} m`}
        />
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-[#FC4C02]"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 8v4l3 3" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Velocidad media"
          value={`${activity.averageSpeed.toFixed(1).replace('.', ',')} km/h`}
        />
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-yellow-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round"/></svg>}
          label="Potencia media"
          value={`${activity.averagePower} W`}
        />
        <StatItem
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-red-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2"/></svg>}
          label="Calorías"
          value={`${activity.calories.toLocaleString('es-ES')} kcal`}
        />
      </div>
    </div>
  )
}

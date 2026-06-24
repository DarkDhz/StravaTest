import type { Activity } from '../types'

interface Props {
  activities: Activity[]
}

function BikeIcon() {
  return (
    <svg className="w-5 h-5 text-[#FC4C02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="5.5" cy="17.5" r="3.5" strokeWidth="1.5"/>
      <circle cx="18.5" cy="17.5" r="3.5" strokeWidth="1.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 6h7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 17.5l3.5-6L12 14l2-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function RecentActivities({ activities }: Props) {
  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col h-full">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Actividades recientes</div>

      <div className="flex flex-col divide-y divide-[#333] flex-1">
        {activities.map((act) => (
          <div key={act.id} className="flex items-center gap-3 py-2.5 first:pt-0">
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#333] flex items-center justify-center">
              <BikeIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{act.name}</div>
              <div className="text-gray-500 text-xs">
                {act.date}
                {act.averageSpeed > 0 && <span className="ml-2 text-gray-600">· {act.averageSpeed.toFixed(1)} km/h</span>}
                {act.averagePower > 0 && <span className="ml-1 text-gray-600">· {act.averagePower} W</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-white text-sm font-semibold">
                {act.distance.toFixed(2).replace('.', ',')} km
              </div>
              <div className="text-gray-500 text-xs">{act.movingTime}</div>
            </div>
          </div>
        ))}
      </div>

      <a
        href="#"
        className="mt-3 pt-3 border-t border-[#333] flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-[#FC4C02] transition-colors"
      >
        VER TODAS EN STRAVA
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeWidth="2"/>
          <polyline points="15 3 21 3 21 9" strokeWidth="2"/>
          <line x1="10" y1="14" x2="21" y2="3" strokeWidth="2"/>
        </svg>
      </a>
    </div>
  )
}

import { useState } from 'react'
import type { WeeklyData } from '../types'

interface Props {
  weeklyData: WeeklyData[]
  weeklyTotal: number
  monthlyTotal: number
  yearlyTotal: number
}

type Tab = 'week' | 'month' | 'year'

export function KilometersChart({ weeklyData, weeklyTotal, monthlyTotal, yearlyTotal }: Props) {
  const [tab, setTab] = useState<Tab>('week')

  const maxVal = Math.max(...weeklyData.map(d => d.km), 1)
  const color = tab === 'week' ? '#22c55e' : '#FC4C02'
  const dimColor = tab === 'week' ? '#1a3a1a' : '#3a1a00'

  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Kilómetros</div>
        <div className="flex gap-1">
          {(['week', 'month', 'year'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                tab === t ? 'bg-[#FC4C02] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'week' ? 'Esta semana' : t === 'month' ? 'Este mes' : 'Este año'}
            </button>
          ))}
        </div>
      </div>

      {/* Custom SVG bar chart */}
      <div className="h-40 w-full">
        <svg width="100%" height="100%" viewBox="0 0 420 160" preserveAspectRatio="none">
          {/* Y-axis grid lines & labels */}
          {[0, 20, 40, 60].map((v) => {
            const y = 140 - (v / (Math.ceil(maxVal * 1.2))) * 130
            return (
              <g key={v}>
                <line x1="28" y1={y} x2="420" y2={y} stroke="#333" strokeWidth="0.5" />
                <text x="22" y={y + 4} textAnchor="end" fill="#6b7280" fontSize="10">{v}</text>
              </g>
            )
          })}

          {/* Bars */}
          {weeklyData.map((d, i) => {
            const slotWidth = (420 - 28) / weeklyData.length
            const barWidth = slotWidth * 0.55
            const x = 28 + i * slotWidth + (slotWidth - barWidth) / 2
            const barH = (d.km / Math.ceil(maxVal * 1.2)) * 130
            const slotH = 130
            const ySlot = 10
            const yBar = 10 + (slotH - barH)

            return (
              <g key={d.day}>
                {/* Ghost slot */}
                <rect x={x} y={ySlot} width={barWidth} height={slotH} fill={dimColor} rx="3" />
                {/* Actual bar */}
                {d.km > 0 && (
                  <rect x={x} y={yBar} width={barWidth} height={barH} fill={color} rx="3" />
                )}
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={152}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="10"
                >
                  {d.day}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#333]">
        <div className="text-center">
          <div className="text-white font-bold text-base sm:text-lg">
            {weeklyTotal.toFixed(1)} <span className="text-sm font-normal text-gray-400">km</span>
          </div>
          <div className="text-gray-500 text-xs">Esta semana</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-base sm:text-lg">
            {monthlyTotal.toFixed(0)} <span className="text-sm font-normal text-gray-400">km</span>
          </div>
          <div className="text-gray-500 text-xs">Este mes</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold text-base sm:text-lg">
            {yearlyTotal.toLocaleString('es-ES')} <span className="text-sm font-normal text-gray-400">km</span>
          </div>
          <div className="text-gray-500 text-xs">Este año</div>
        </div>
      </div>
    </div>
  )
}

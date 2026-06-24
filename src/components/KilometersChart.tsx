import { useState, useRef, useEffect } from 'react'
import type { WeeklyData, ChartBar } from '../types'

interface Props {
  weeklyData: WeeklyData[]
  monthlyData: ChartBar[]
  yearlyData: ChartBar[]
  weeklyTotal: number
  monthlyTotal: number
  yearlyTotal: number
  weeklyAvgSpeed?: number
}

type Tab    = 'week' | 'month' | 'year'
type Metric = 'km' | 'elevation' | 'speed' | 'time'

type Bar = { label: string; km: number; elevation?: number; speed?: number; time?: number }

const METRICS: { key: Metric; label: string; color: string; dimColor: string; unit: string }[] = [
  { key: 'km',        label: 'Kilómetros',     color: '#22c55e', dimColor: '#1a3a1a', unit: 'km'   },
  { key: 'elevation', label: 'Desnivel',        color: '#3b82f6', dimColor: '#0f2040', unit: 'm'    },
  { key: 'speed',     label: 'Velocidad media', color: '#FC4C02', dimColor: '#3a1a00', unit: 'km/h' },
  { key: 'time',      label: 'Tiempo activo',   color: '#a855f7', dimColor: '#2a1040', unit: 'h'    },
]

function getVal(bar: Bar, metric: Metric): number {
  switch (metric) {
    case 'km':        return bar.km
    case 'elevation': return bar.elevation ?? 0
    case 'speed':     return bar.speed ?? 0
    case 'time':      return bar.time ?? 0
  }
}

function fmtTooltip(val: number, metric: Metric): string {
  switch (metric) {
    case 'km':        return `${val % 1 === 0 ? val : val.toFixed(1)} km`
    case 'elevation': return `${Math.round(val)} m`
    case 'speed':     return val > 0 ? `${val.toFixed(1)} km/h` : '—'
    case 'time': {
      const h = Math.floor(val)
      const m = Math.round((val - h) * 60)
      return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
    }
  }
}

function fmtYAxis(val: number, metric: Metric): string {
  if (metric === 'time') {
    const h = Math.floor(val)
    const m = Math.round((val - h) * 60)
    return h > 0 ? `${h}h` : m > 0 ? `${m}m` : '0'
  }
  return `${val}`
}

function periodTotal(data: Bar[], metric: Metric): number {
  const vals = data.map(b => getVal(b, metric))
  if (metric === 'speed') {
    const nonZero = vals.filter(v => v > 0)
    return nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0
  }
  return vals.reduce((a, b) => a + b, 0)
}

function fmtStat(val: number, metric: Metric): { value: string; unit: string } {
  switch (metric) {
    case 'km':
      return { value: val.toLocaleString('es-ES', { maximumFractionDigits: 1 }), unit: 'km' }
    case 'elevation':
      return { value: Math.round(val).toLocaleString('es-ES'), unit: 'm' }
    case 'speed':
      return { value: val > 0 ? val.toFixed(1) : '—', unit: val > 0 ? 'km/h' : '' }
    case 'time': {
      const h = Math.floor(val)
      const m = Math.round((val - h) * 60)
      return { value: h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`, unit: '' }
    }
  }
}

export function KilometersChart({
  weeklyData, monthlyData, yearlyData,
  weeklyTotal, monthlyTotal, yearlyTotal,
}: Props) {
  const [tab, setTab]       = useState<Tab>('week')
  const [metric, setMetric] = useState<Metric>('km')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const bars: Bar[] =
    tab === 'month' ? monthlyData :
    tab === 'year'  ? yearlyData  :
    weeklyData.map(d => ({ label: d.day, km: d.km, elevation: d.elevation, speed: d.speed, time: d.time }))

  const activeValues = bars.map(b => getVal(b, metric))
  const maxVal   = Math.max(...activeValues, 1)
  const chartMax = Math.ceil(maxVal * 1.2)
  const rawStep  = chartMax / 3
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const tickStep  = Math.ceil(rawStep / magnitude) * magnitude
  const ticks     = [0, tickStep, tickStep * 2, tickStep * 3]
  const scaleMax  = tickStep * 3

  const activeMeta = METRICS.find(m => m.key === metric)!

  // Period totals for the selected metric
  // For km use the HA-sourced props; for other metrics compute from bar data
  const weekStat  = fmtStat(metric === 'km' ? weeklyTotal  : periodTotal(bars, metric), metric)
  const monthStat = fmtStat(metric === 'km' ? monthlyTotal : periodTotal(monthlyData, metric), metric)
  const yearStat  = fmtStat(metric === 'km' ? yearlyTotal  : periodTotal(yearlyData, metric), metric)

  // Streak: consecutive active days (by km) ending at last active day
  const lastActiveIdx = weeklyData.reduce((last, d, i) => d.km > 0 ? i : last, -1)
  let streak = 0
  for (let i = lastActiveIdx; i >= 0; i--) {
    if (weeklyData[i].km > 0) streak++
    else break
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'week',  label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year',  label: 'Este año' },
  ]

  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-3 h-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-2">

        {/* Left: metric dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider font-medium hover:text-white transition-colors cursor-pointer select-none"
            >
              {activeMeta.label}
              <svg
                className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 bg-[#1a1a1a] border border-[#444] rounded-lg py-1 z-20 min-w-[150px] shadow-lg">
                {METRICS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => { setMetric(m.key); setDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                      metric === m.key ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {metric === m.key && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    )}
                    {metric !== m.key && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 bg-[#FC4C02]/15 text-[#FC4C02] text-xs px-2 py-0.5 rounded-full font-medium">
              <span className="text-[8px]">&#9679;</span>
              {streak} {streak === 1 ? 'día' : 'días'}
            </div>
          )}
        </div>

        {/* Right: period tabs */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                tab === t.key ? 'bg-[#FC4C02] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG bar chart */}
      <div className="h-40 w-full">
        <svg width="100%" height="100%" viewBox="0 0 420 160" preserveAspectRatio="none">
          {ticks.map(v => {
            const y = 140 - (v / scaleMax) * 130
            return (
              <g key={v}>
                <line x1="28" y1={y} x2="420" y2={y} stroke="#333" strokeWidth="0.5" />
                <text x="22" y={y + 4} textAnchor="end" fill="#6b7280" fontSize="9">
                  {fmtYAxis(v, metric)}
                </text>
              </g>
            )
          })}

          {bars.map((d, i) => {
            const val      = activeValues[i]
            const slotW    = (420 - 28) / bars.length
            const barW     = slotW * 0.55
            const x        = 28 + i * slotW + (slotW - barW) / 2
            const barH     = (val / scaleMax) * 130
            const ySlot    = 10
            const yBar     = 10 + (130 - barH)
            const isHovered = hoveredIndex === i
            const tipX     = Math.min(Math.max(x + barW / 2, 32), 388)
            const tipY     = yBar - 8

            return (
              <g key={d.label}>
                <rect x={x} y={ySlot} width={barW} height={130} fill={activeMeta.dimColor} rx="3" />
                {val > 0 && (
                  <rect x={x} y={yBar} width={barW} height={barH} fill={activeMeta.color} rx="3" />
                )}
                <rect
                  x={x} y={ySlot} width={barW} height={130}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'default' }}
                />
                {isHovered && val > 0 && (
                  <g>
                    <rect x={tipX - 28} y={tipY - 14} width={56} height={16}
                      fill="#1a1a1a" stroke="#444" strokeWidth="0.8" rx="3" />
                    <text x={tipX} y={tipY - 3} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                      {fmtTooltip(val, metric)}
                    </text>
                  </g>
                )}
                <text
                  x={x + barW / 2} y={152}
                  textAnchor="middle"
                  fill={isHovered ? 'white' : '#6b7280'}
                  fontSize="10"
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bottom stats — 3 periods for the active metric */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#333]">
        {[
          { stat: weekStat,  label: 'Esta semana' },
          { stat: monthStat, label: 'Este mes' },
          { stat: yearStat,  label: 'Este año' },
        ].map(({ stat, label }) => (
          <div key={label} className="text-center">
            <div className="text-white font-bold text-base sm:text-lg">
              {stat.value}
              {stat.unit && <span className="text-sm font-normal text-gray-400 ml-1">{stat.unit}</span>}
            </div>
            <div className="text-gray-500 text-xs">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

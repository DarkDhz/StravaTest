import { useState } from 'react'
import type { Goals as GoalsType } from '../types'

const STORAGE_KEY = 'goal-targets'

interface TargetValues {
  weekly: number
  monthly: number
  yearly: number
}

function loadTargets(defaults: TargetValues): TargetValues {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as TargetValues
  } catch {}
  return defaults
}

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

interface ConfigPopupProps {
  targets: TargetValues
  onSave: (t: TargetValues) => void
  onClose: () => void
}

function ConfigPopup({ targets, onSave, onClose }: ConfigPopupProps) {
  const [draft, setDraft] = useState<TargetValues>({ ...targets })

  const set = (key: keyof TargetValues, value: string) => {
    const n = parseInt(value, 10)
    if (!isNaN(n) && n > 0) setDraft(prev => ({ ...prev, [key]: n }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-5 w-72 flex flex-col gap-4 shadow-2xl"
        style={{ backgroundColor: '#2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Configurar objetivos</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Inputs */}
        {(
          [
            { key: 'weekly', label: 'Semanal', color: '#22c55e' },
            { key: 'monthly', label: 'Mensual', color: '#FC4C02' },
            { key: 'yearly', label: 'Anual', color: '#3b82f6' },
          ] as const
        ).map(({ key, label, color }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs" style={{ color }}>
              {label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={draft[key]}
                onChange={e => set(key, e.target.value)}
                className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1"
                style={{
                  backgroundColor: '#1a1a1a',
                  border: `1px solid ${color}44`,
                  // @ts-expect-error ring color via CSS variable trick
                  '--tw-ring-color': color,
                }}
              />
              <span className="text-xs text-gray-500 w-6">km</span>
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(draft)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#FC4C02' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export function Goals({ goals }: Props) {
  const defaults: TargetValues = {
    weekly: goals.weekly.target,
    monthly: goals.monthly.target,
    yearly: goals.yearly.target,
  }

  const [targets, setTargets] = useState<TargetValues>(() => loadTargets(defaults))
  const [showConfig, setShowConfig] = useState(false)

  const handleSave = (t: TargetValues) => {
    setTargets(t)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
    setShowConfig(false)
  }

  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Objetivos</div>
        <button
          onClick={() => setShowConfig(true)}
          className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          title="Configurar objetivos"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            <path strokeWidth="2" strokeLinecap="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <GoalRow
        label="Esta semana"
        current={goals.weekly.current}
        target={targets.weekly}
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
        target={targets.monthly}
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
        target={targets.yearly}
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

      {showConfig && (
        <ConfigPopup
          targets={targets}
          onSave={handleSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}

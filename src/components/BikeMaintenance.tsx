import { useState } from 'react'
import type { BikeMaintenance as BikeMaintenanceType } from '../types'

const STORAGE_KEY = 'maintenance-thresholds'

interface ThresholdValues {
  chain: number
  tires: number
  brakes: number
  generalService: number
}

function loadThresholds(defaults: ThresholdValues): ThresholdValues {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as ThresholdValues
  } catch {}
  return defaults
}

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

interface ConfigPopupProps {
  thresholds: ThresholdValues
  onSave: (t: ThresholdValues) => void
  onClose: () => void
}

function ConfigPopup({ thresholds, onSave, onClose }: ConfigPopupProps) {
  const [draft, setDraft] = useState<ThresholdValues>({ ...thresholds })

  const set = (key: keyof ThresholdValues, value: string) => {
    const n = parseInt(value, 10)
    if (!isNaN(n) && n > 0) setDraft(prev => ({ ...prev, [key]: n }))
  }

  const rows: { key: keyof ThresholdValues; label: string }[] = [
    { key: 'chain', label: 'Cadena' },
    { key: 'tires', label: 'Cubiertas' },
    { key: 'brakes', label: 'Pastillas de freno' },
    { key: 'generalService', label: 'Revisión general' },
  ]

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
          <span className="text-white font-semibold text-sm">Configurar umbrales</span>
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
        {rows.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs text-[#FC4C02]">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={draft[key]}
                onChange={e => set(key, e.target.value)}
                className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#FC4C02]"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #FC4C0244' }}
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

export function BikeMaintenance({ maintenance }: Props) {
  const defaults: ThresholdValues = {
    chain: maintenance.chain.max,
    tires: maintenance.tires.max,
    brakes: maintenance.brakes.max,
    generalService: maintenance.generalService.max,
  }

  const [thresholds, setThresholds] = useState<ThresholdValues>(() => loadThresholds(defaults))
  const [showConfig, setShowConfig] = useState(false)

  const handleSave = (t: ThresholdValues) => {
    setThresholds(t)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
    setShowConfig(false)
  }

  return (
    <div className="bg-[#242424] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mantenimiento de la bici</div>
        <button
          onClick={() => setShowConfig(true)}
          className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          title="Configurar umbrales"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            <path strokeWidth="2" strokeLinecap="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <MaintenanceRow
          label="Cadena"
          current={maintenance.chain.current}
          max={thresholds.chain}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Cubiertas"
          current={maintenance.tires.current}
          max={thresholds.tires}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Pastillas de freno"
          current={maintenance.brakes.current}
          max={thresholds.brakes}
          icon={<WrenchIcon />}
        />
        <MaintenanceRow
          label="Revisión general"
          current={maintenance.generalService.current}
          max={thresholds.generalService}
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

      {showConfig && (
        <ConfigPopup
          thresholds={thresholds}
          onSave={handleSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}

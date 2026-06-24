import { useState, useEffect } from 'react'

interface HeaderProps {
  onRefresh: () => void
  loading: boolean
}

function StravaLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FC4C02">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
      <span className="text-white font-bold text-lg tracking-widest uppercase">Strava</span>
    </div>
  )
}

export function Header({ onRefresh, loading }: HeaderProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
      <StravaLogo />

      <div className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
          </svg>
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
          </svg>
          <span className="font-mono">{timeStr}</span>
        </div>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-2 rounded-full hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
        title="Actualizar datos"
      >
        <svg
          className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
          <polyline points="1 20 1 14 7 14" strokeWidth="2"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeWidth="2"/>
        </svg>
      </button>
    </header>
  )
}

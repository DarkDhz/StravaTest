import { useEffect, useRef, useState } from 'react'
import type { Activity } from '../types'

interface Props {
  activity: Activity
}

export function ActivityMap({ activity }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const [tilesLoaded, setTilesLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return
    setTilesLoaded(false)

    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
      })

      mapInstanceRef.current = map

      const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      })

      tileLayer.on('load', () => setTilesLoaded(true))
      tileLayer.addTo(map)

      if (activity.polyline && activity.polyline.length > 0) {
        const poly = L.polyline(activity.polyline, {
          color: '#FC4C02',
          weight: 3,
          opacity: 0.9,
        }).addTo(map)
        map.fitBounds(poly.getBounds(), { padding: [24, 24] })
      } else {
        map.setView([40.416775, -3.703790], 11)
      }
    })

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id])

  return (
    <div className="bg-[#242424] rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mapa de la actividad</div>
      </div>
      <div className="relative flex-1 min-h-[220px]">
        <div ref={mapRef} className="absolute inset-0 z-0" />
        {!tilesLoaded && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              <svg className="w-4 h-4 animate-pulse text-[#FC4C02]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Cargando mapa...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

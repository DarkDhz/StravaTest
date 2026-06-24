import { useState, useEffect, useCallback } from 'react'
import type { DashboardData } from '../types'
import { fetchDashboardData, getMockData } from '../services/homeassistant'

export function useDashboard(refreshInterval = 60000) {
  const [data, setData] = useState<DashboardData>(getMockData())
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const fresh = await fetchDashboardData()
      setData(fresh)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('[Dashboard] fetch failed', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, refreshInterval)
    return () => clearInterval(id)
  }, [refresh, refreshInterval])

  return { data, loading, lastRefresh, refresh }
}

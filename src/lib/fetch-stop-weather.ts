import type { Stop } from '@/types'
import { getDayStats } from '@/forecast'
import { useTripStore } from '@/store/trip-store'

export async function fetchStopWeather(stop: Stop): Promise<void> {
  const { setDayStats } = useTripStore.getState()
  setDayStats(stop.id, 'loading')
  try {
    const days = await getDayStats(stop)
    setDayStats(stop.id, days)
  } catch {
    setDayStats(stop.id, 'error')
  }
}

import type { Stop } from '@/types'
import { getDayStats } from '@/forecast'
import { HttpError } from '@/open-meteo'
import { useTripStore } from '@/store/trip-store'

export async function fetchStopWeather(stop: Stop): Promise<void> {
  const { beginFetch, commitDayStats } = useTripStore.getState()
  // Capture this fetch's version; commitDayStats only applies the result if
  // no newer fetch for this stop id has started in the meantime, so a slow
  // stale response can't clobber a newer edit's result (ticket 002).
  const version = beginFetch(stop.id)
  try {
    const days = await getDayStats(stop)
    commitDayStats(stop.id, version, days)
  } catch (error) {
    commitDayStats(
      stop.id,
      version,
      error instanceof HttpError && error.status === 429 ? 'rate-limited' : 'error',
    )
  }
}

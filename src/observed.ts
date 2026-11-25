import type { DayStats } from '@/types'
import { aggregateHistoricalDay, fetchHistoricalSeries } from './climatology'
import { fetchDailySeriesCached, type DailySeries } from './open-meteo'

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

// Past days are final, so this is long. Kept finite in case the archive
// revises recent (provisional) values.
const OBSERVED_FRESH_MS = 24 * 60 * 60 * 1000

// In-memory only: dedupes concurrent calls for the same location + range.
const cache = new Map<string, Promise<DailySeries>>()

// Unlike the forecast/historical series, the observed series covers just the
// stop's own date range, so the range must be part of the cache key.
export function observedCacheKey(lat: number, lon: number, start: string, end: string): string {
  return `weather-trip:observed:v1:${lat.toFixed(2)},${lon.toFixed(2)}:${start}:${end}`
}

export function fetchObservedSeries(lat: number, lon: number, start: string, end: string): Promise<DailySeries> {
  const key = observedCacheKey(lat, lon, start, end)
  const cached = cache.get(key)
  if (cached) return cached

  const url = new URL(ARCHIVE_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('start_date', start)
  url.searchParams.set('end_date', end)
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode')
  url.searchParams.set('timezone', 'auto')

  const promise = fetchDailySeriesCached(url, key, OBSERVED_FRESH_MS).catch((error: unknown) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, promise)
  return promise
}

/**
 * Merges what actually happened on `date` with the 30-year normal for that
 * calendar day. Returns the normal unchanged (source 'historical') if the
 * observed series has no value for the day, so a gap never shows as NaN.
 */
export function aggregateObservedDay(observed: DailySeries, historical: DailySeries, date: string): DayStats {
  const normal = aggregateHistoricalDay(historical, date)
  const index = observed.time.indexOf(date)
  const high = index >= 0 ? observed.tMax[index] : null
  const low = index >= 0 ? observed.tMin[index] : null
  if (high == null || low == null) return normal

  const precip = observed.precip[index]
  const code = observed.weatherCode[index]
  return {
    ...normal,
    weatherCode: code ?? normal.weatherCode,
    source: 'observed',
    actualHigh: high,
    actualLow: low,
    actualPrecip: precip ?? NaN,
  }
}

/** `dates` must be sorted ascending; the first and last bound the request. */
export async function getObservedDayStats(
  lat: number,
  lon: number,
  dates: string[],
): Promise<DayStats[]> {
  const [observed, historical] = await Promise.all([
    fetchObservedSeries(lat, lon, dates[0], dates[dates.length - 1]),
    fetchHistoricalSeries(lat, lon),
  ])
  return dates.map((date) => aggregateObservedDay(observed, historical, date))
}

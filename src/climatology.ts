import type { DayStats } from '@/types'
import { cacheKey, fetchDailySeries, mean, type DailySeries } from './open-meteo'

const HISTORICAL_URL = 'https://archive-api.open-meteo.com/v1/archive'
const HISTORICAL_START = '1991-01-01'
const HISTORICAL_END = '2020-12-31'
const POOL_WINDOW_DAYS = 3
const WET_DAY_THRESHOLD_MM = 1

// Cached by location only (never by date) — editing a stop's startDate/nights
// must re-filter this cache, not refetch it.
const cache = new Map<string, Promise<DailySeries>>()

export function fetchHistoricalSeries(lat: number, lon: number): Promise<DailySeries> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached) return cached

  const url = new URL(HISTORICAL_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('start_date', HISTORICAL_START)
  url.searchParams.set('end_date', HISTORICAL_END)
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum')
  url.searchParams.set('timezone', 'auto')

  const promise = fetchDailySeries(url).catch((error: unknown) => {
    cache.delete(key) // don't cache a failed fetch
    throw error
  })
  cache.set(key, promise)
  return promise
}

export async function getHistoricalDayStats(
  lat: number,
  lon: number,
  dates: string[],
): Promise<DayStats[]> {
  const series = await fetchHistoricalSeries(lat, lon)
  return dates.map((date) => aggregateHistoricalDay(series, date))
}

export function aggregateHistoricalDay(series: DailySeries, date: string): DayStats {
  const window = monthDayWindow(date, POOL_WINDOW_DAYS)
  const highs: number[] = []
  const lows: number[] = []
  const precips: number[] = []

  series.time.forEach((sampleDate, i) => {
    if (!window.has(sampleDate.slice(5))) return
    const high = series.tMax[i]
    const low = series.tMin[i]
    const precip = series.precip[i]
    if (high != null) highs.push(high)
    if (low != null) lows.push(low)
    if (precip != null) precips.push(precip)
  })

  return {
    date,
    avgHigh: mean(highs),
    avgLow: mean(lows),
    precipMean: mean(precips),
    wetDayProbability: precips.length
      ? precips.filter((p) => p > WET_DAY_THRESHOLD_MM).length / precips.length
      : NaN,
    recordHigh: highs.length ? Math.max(...highs) : NaN,
    recordLow: lows.length ? Math.min(...lows) : NaN,
    source: 'historical',
    elevationM: series.elevationM,
  }
}

// All years pooled onto one non-leap-aware calendar, ±spanDays around `date`,
// as "MM-DD" strings — e.g. Jun 15 ±3 -> Jun 12..Jun 18, wrapping year
// boundaries correctly (Jan 1 ±3 reaches into December).
function monthDayWindow(date: string, spanDays: number): Set<string> {
  const [year, month, day] = date.split('-').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day))
  const window = new Set<string>()
  for (let offset = -spanDays; offset <= spanDays; offset++) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + offset)
    window.add(`${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`)
  }
  return window
}

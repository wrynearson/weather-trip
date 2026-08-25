import type { DayStats, Stop } from '@/types'
import { getHistoricalDayStats } from './climatology'
import { cacheKey, fetchDailySeries, type DailySeries } from './open-meteo'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const FORECAST_DAYS = 16
const FORECAST_THRESHOLD_DAYS = 15
const WET_DAY_THRESHOLD_MM = 1

const cache = new Map<string, Promise<DailySeries>>()

export function fetchForecastSeries(lat: number, lon: number): Promise<DailySeries> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached) return cached

  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum')
  url.searchParams.set('forecast_days', String(FORECAST_DAYS))
  url.searchParams.set('timezone', 'auto')

  const promise = fetchDailySeries(url).catch((error: unknown) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, promise)
  return promise
}

/**
 * Decides forecast vs. historical once per stop, from startDate vs. today —
 * not per night, even if a long stay straddles the 15-day threshold.
 */
export async function getDayStats(stop: Stop): Promise<DayStats[]> {
  const dates = stopDates(stop)
  if (daysUntil(stop.startDate) <= FORECAST_THRESHOLD_DAYS) {
    return getForecastDayStats(stop.lat, stop.lon, dates)
  }
  return getHistoricalDayStats(stop.lat, stop.lon, dates)
}

async function getForecastDayStats(lat: number, lon: number, dates: string[]): Promise<DayStats[]> {
  const series = await fetchForecastSeries(lat, lon)
  return dates.map((date) => aggregateForecastDay(series, date))
}

function aggregateForecastDay(series: DailySeries, date: string): DayStats {
  const index = nearestIndex(series, date)
  const high = index >= 0 ? series.tMax[index] : null
  const low = index >= 0 ? series.tMin[index] : null
  const precip = index >= 0 ? series.precip[index] : null

  return {
    date,
    avgHigh: high ?? NaN,
    avgLow: low ?? NaN,
    precipMean: precip ?? NaN,
    wetDayProbability: precip != null ? Number(precip > WET_DAY_THRESHOLD_MM) : NaN,
    // a single forecast day has no year-over-year spread, so record == avg
    recordHigh: high ?? NaN,
    recordLow: low ?? NaN,
    source: 'forecast',
    elevationM: series.elevationM,
  }
}

// A stay can extend a night or two past the 16-day forecast window; fall
// back to the nearest available day rather than dropping the night.
function nearestIndex(series: DailySeries, date: string): number {
  if (series.time.length === 0) return -1
  const exact = series.time.indexOf(date)
  if (exact !== -1) return exact

  const target = new Date(`${date}T00:00:00Z`).getTime()
  let bestIndex = 0
  let bestDiff = Infinity
  series.time.forEach((t, i) => {
    const diff = Math.abs(new Date(`${t}T00:00:00Z`).getTime() - target)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIndex = i
    }
  })
  return bestIndex
}

export function daysUntil(date: string): number {
  const today = new Date()
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, month, day] = date.split('-').map(Number)
  const targetUTC = Date.UTC(year, month - 1, day)
  return Math.round((targetUTC - todayUTC) / 86_400_000)
}

function stopDates(stop: Stop): string[] {
  const [year, month, day] = stop.startDate.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day))
  return Array.from({ length: stop.nights }, (_, i) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

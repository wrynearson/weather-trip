import type { DayStats, Stop } from '@/types'
import { getHistoricalDayStats, getHistoricalRecordRanges, type RecordRange } from './climatology'
import { cacheKey, fetchDailySeriesCached, type DailySeries } from './open-meteo'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const FORECAST_DAYS = 16
// One less than FORECAST_DAYS - 1 (the API's max): Open-Meteo's daily
// aggregates need a full day of hourly source data, and the *last* day of
// any forecast_days request never has one yet, so every field (not just
// precipitation_probability_max, see aggregateForecastDay) comes back null
// for it. forecast_days caps at 16 — there's no buffer day to request
// instead — so that last index is simply never trusted as "forecast";
// dates that far out fall to the historical path instead.
const FORECAST_THRESHOLD_DAYS = 14
const WET_DAY_THRESHOLD_MM = 1

// Open-Meteo's forecast model refreshes a few times a day — a few hours of
// staleness is imperceptible for trip planning, and avoids re-fetching on
// every reload during a session.
const FORECAST_FRESH_MS = 3 * 60 * 60 * 1000

// In-memory only: dedupes concurrent calls for the same location within one
// page session. Persistence across reloads is localStorage's job, inside
// fetchDailySeriesCached.
const cache = new Map<string, Promise<DailySeries>>()

export function fetchForecastSeries(lat: number, lon: number): Promise<DailySeries> {
  const key = cacheKey(lat, lon)
  const cached = cache.get(key)
  if (cached) return cached

  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode',
  )
  url.searchParams.set('forecast_days', String(FORECAST_DAYS))
  url.searchParams.set('timezone', 'auto')

  // v2: adds precipitation_probability_max — bump the key so caches saved
  // before that field existed don't get served as if they had it.
  const promise = fetchDailySeriesCached(url, `weather-trip:forecast:v2:${key}`, FORECAST_FRESH_MS).catch(
    (error: unknown) => {
      cache.delete(key)
      throw error
    },
  )
  cache.set(key, promise)
  return promise
}

/**
 * Decides forecast vs. historical per night, from each night's own date vs.
 * today — a long stay can straddle the 15-day threshold, with early nights
 * forecast and later nights falling back to historical.
 */
export async function getDayStats(stop: Stop): Promise<DayStats[]> {
  const dates = stopDates(stop)
  const forecastDates = dates.filter((date) => daysUntil(date) >= 0 && daysUntil(date) <= FORECAST_THRESHOLD_DAYS)
  const historicalDates = dates.filter((date) => daysUntil(date) < 0 || daysUntil(date) > FORECAST_THRESHOLD_DAYS)

  if (historicalDates.length === 0) {
    return getForecastDayStats(stop.lat, stop.lon, dates)
  }
  if (forecastDates.length === 0) {
    return getHistoricalDayStats(stop.lat, stop.lon, dates)
  }

  const [forecastStats, historicalStats] = await Promise.all([
    getForecastDayStats(stop.lat, stop.lon, forecastDates),
    getHistoricalDayStats(stop.lat, stop.lon, historicalDates),
  ])
  const byDate = new Map([...forecastStats, ...historicalStats].map((day) => [day.date, day]))
  return dates.map((date) => byDate.get(date)!)
}

async function getForecastDayStats(lat: number, lon: number, dates: string[]): Promise<DayStats[]> {
  const [series, recordRanges] = await Promise.all([
    fetchForecastSeries(lat, lon),
    getHistoricalRecordRanges(lat, lon, dates),
  ])
  return dates.map((date) => aggregateForecastDay(series, date, recordRanges.get(date)))
}

function aggregateForecastDay(series: DailySeries, date: string, recordRange: RecordRange | undefined): DayStats {
  const index = nearestIndex(series, date)
  const high = index >= 0 ? series.tMax[index] : null
  const low = index >= 0 ? series.tMin[index] : null
  const precip = index >= 0 ? series.precip[index] : null
  // Optional chaining guards against a pre-existing localStorage cache entry
  // from before this field existed — old cached series won't have it.
  const precipProbability = index >= 0 ? (series.precipProbabilityMax?.[index] ?? null) : null
  // Open-Meteo can return null probability for the tail days of a 16-day
  // request (they don't get a full 24h of hourly data to aggregate) — which
  // includes our forecast/historical boundary day. Fall back to a binary
  // estimate from the precip total rather than showing no chance at all.
  const wetDayProbability =
    precipProbability != null
      ? precipProbability / 100
      : precip != null
        ? Number(precip > WET_DAY_THRESHOLD_MM)
        : NaN
  const weatherCode = index >= 0 ? series.weatherCode[index] : null

  return {
    date,
    avgHigh: high ?? NaN,
    avgLow: low ?? NaN,
    precipMean: precip ?? NaN,
    wetDayProbability,
    weatherCode: weatherCode ?? NaN,
    recordHigh: recordRange?.recordHigh ?? NaN,
    recordLow: recordRange?.recordLow ?? NaN,
    source: 'forecast',
    elevationM: series.elevationM,
  }
}

// getDayStats only ever asks for dates within the forecast window, so this
// should always hit the exact-match branch — the nearest-day fallback just
// guards against the API returning a short/gappy series.
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

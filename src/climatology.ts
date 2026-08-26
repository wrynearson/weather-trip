import type { DayStats } from '@/types'
import { mode } from '@/lib/utils'
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
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode')
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

// Pools every sampled year's values that fall within ±POOL_WINDOW_DAYS of
// `date` on the calendar (ignoring year), for whichever fields the caller
// needs out of them.
function poolSamples(series: DailySeries, date: string) {
  const window = monthDayWindow(date, POOL_WINDOW_DAYS)
  const highs: number[] = []
  const lows: number[] = []
  const precips: number[] = []
  const weatherCodes: number[] = []

  series.time.forEach((sampleDate, i) => {
    if (!window.has(sampleDate.slice(5))) return
    const high = series.tMax[i]
    const low = series.tMin[i]
    const precip = series.precip[i]
    const weatherCode = series.weatherCode[i]
    if (high != null) highs.push(high)
    if (low != null) lows.push(low)
    if (precip != null) precips.push(precip)
    if (weatherCode != null) weatherCodes.push(weatherCode)
  })

  return { highs, lows, precips, weatherCodes }
}

export function aggregateHistoricalDay(series: DailySeries, date: string): DayStats {
  const { highs, lows, precips, weatherCodes } = poolSamples(series, date)

  return {
    date,
    avgHigh: mean(highs),
    avgLow: mean(lows),
    precipMean: mean(precips),
    wetDayProbability: precips.length
      ? precips.filter((p) => p > WET_DAY_THRESHOLD_MM).length / precips.length
      : NaN,
    // A historical "day" pools ~180 sampled days (30 years x 7-day window),
    // each with its own weather code — the mode is the most representative
    // single condition for that calendar date, unlike averaging a temperature.
    weatherCode: weatherCodes.length ? (mode(weatherCodes) ?? NaN) : NaN,
    recordHigh: highs.length ? Math.max(...highs) : NaN,
    recordLow: lows.length ? Math.min(...lows) : NaN,
    source: 'historical',
    elevationM: series.elevationM,
  }
}

export type RecordRange = { recordHigh: number; recordLow: number }

function historicalRecordRange(series: DailySeries, date: string): RecordRange {
  const { highs, lows } = poolSamples(series, date)
  return {
    recordHigh: highs.length ? Math.max(...highs) : NaN,
    recordLow: lows.length ? Math.min(...lows) : NaN,
  }
}

// A forecast day is a single value, not a distribution — it has no record
// range of its own. This gives it the same 30-year record high/low a
// historical day for that calendar date would have, so the chart's record
// band means the same thing (and isn't just a copy of the forecast value)
// whether or not the day happens to fall within the forecast window.
export async function getHistoricalRecordRanges(
  lat: number,
  lon: number,
  dates: string[],
): Promise<Map<string, RecordRange>> {
  const series = await fetchHistoricalSeries(lat, lon)
  return new Map(dates.map((date) => [date, historicalRecordRange(series, date)]))
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

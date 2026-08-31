import type { Stop } from '@/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getHistoricalDayStats, getHistoricalRecordRanges } from './climatology'
import { daysUntil, getDayStats } from './forecast'
import { fetchDailySeriesCached } from './open-meteo'

// forecast.ts pulls getHistoricalDayStats/getHistoricalRecordRanges from
// climatology.ts, and fetchDailySeriesCached from open-meteo.ts. Mocking
// both lets us drive getDayStats end-to-end (exercising the real
// forecast/historical boundary split from ticket 001) without any network
// access or real localStorage-backed caching.
vi.mock('./open-meteo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./open-meteo')>()
  return { ...actual, fetchDailySeriesCached: vi.fn() }
})

vi.mock('./climatology', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./climatology')>()
  return {
    ...actual,
    getHistoricalDayStats: vi.fn(),
    getHistoricalRecordRanges: vi.fn(),
  }
})

// Noon UTC avoids any local-midnight edge cases; TZ is also pinned to UTC in
// vite.config.ts so `daysUntil`'s local-time getters agree with these dates
// regardless of the machine running the tests.
const FIXED_NOW = new Date('2024-03-15T12:00:00Z')

function dateRange(start: string, count: number): string[] {
  const [year, month, day] = start.split('-').map(Number)
  const base = new Date(Date.UTC(year, month - 1, day))
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['2024-03-14', -1], // past — the exact case ticket 001's bug mishandled
    ['2024-03-15', 0], // today
    ['2024-03-29', 14], // exactly at the forecast threshold
    ['2024-03-30', 15], // just past the threshold — ticket 010: API's last day is unreliable
    ['2024-04-15', 31], // far future
  ])('daysUntil(%s) === %d', (date, expected) => {
    expect(daysUntil(date)).toBe(expected)
  })
})

describe('getDayStats forecast/historical boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('routes a past date, today, day 14, day 15, and a far-future date to the correct source', async () => {
    // 32 consecutive nights: 2024-03-14 (yesterday) through 2024-04-14
    // (30 days out), so the range straddles every boundary case at once.
    const allDates = dateRange('2024-03-14', 32)

    vi.mocked(fetchDailySeriesCached).mockResolvedValue({
      time: allDates,
      tMax: allDates.map((_, i) => 20 + i),
      tMin: allDates.map((_, i) => 10 + i),
      precip: allDates.map(() => 0),
      precipProbabilityMax: allDates.map(() => 5),
      weatherCode: allDates.map(() => 1),
      elevationM: 50,
    })

    vi.mocked(getHistoricalDayStats).mockImplementation(async (_lat, _lon, dates) =>
      dates.map((date) => ({
        date,
        avgHigh: 1,
        avgLow: 0,
        precipMean: 0,
        wetDayProbability: 0,
        weatherCode: 1,
        recordHigh: 1,
        recordLow: 0,
        source: 'historical' as const,
        elevationM: 50,
      })),
    )

    vi.mocked(getHistoricalRecordRanges).mockImplementation(async (_lat, _lon, dates) =>
      new Map(dates.map((date) => [date, { recordHigh: Number.NaN, recordLow: Number.NaN }])),
    )

    const stop: Stop = {
      id: 'boundary-stop',
      city: 'Test City',
      region: 'Test Region',
      lat: 10,
      lon: 20,
      startDate: '2024-03-14',
      nights: 32,
    }

    const result = await getDayStats(stop)
    const byDate = new Map(result.map((day) => [day.date, day]))

    expect(byDate.get('2024-03-14')?.source).toBe('historical') // past
    expect(byDate.get('2024-03-15')?.source).toBe('forecast') // today
    expect(byDate.get('2024-03-29')?.source).toBe('forecast') // day 14
    expect(byDate.get('2024-03-30')?.source).toBe('historical') // day 15 — ticket 010
    expect(byDate.get('2024-04-14')?.source).toBe('historical') // far future
  })

  it('never reads day 15 from the forecast series, even when the API returns it fully null (ticket 010)', async () => {
    // Mirrors what Open-Meteo actually returns: every field null on the
    // last (16th) day of a forecast_days=16 request. If getDayStats still
    // asked for this date as "forecast", aggregateForecastDay would surface
    // NaN/'unknown' for it — the exact "No data" bug reported live for a
    // stop stay that reached day 15.
    const forecastDates = dateRange('2024-03-15', 16) // today .. day 15 (16 entries)
    const nullLastDay = <T,>(values: T[]): (T | null)[] => values.map((v, i) => (i === 15 ? null : v))

    vi.mocked(fetchDailySeriesCached).mockResolvedValue({
      time: forecastDates,
      tMax: nullLastDay(forecastDates.map((_, i) => 20 + i)),
      tMin: nullLastDay(forecastDates.map((_, i) => 10 + i)),
      precip: nullLastDay(forecastDates.map(() => 0)),
      precipProbabilityMax: nullLastDay(forecastDates.map(() => 5)),
      weatherCode: nullLastDay(forecastDates.map(() => 1)),
      elevationM: 25,
    })

    vi.mocked(getHistoricalDayStats).mockImplementation(async (_lat, _lon, dates) =>
      dates.map((date) => ({
        date,
        avgHigh: 18,
        avgLow: 11,
        precipMean: 2,
        wetDayProbability: 0.28,
        weatherCode: 3,
        recordHigh: 30,
        recordLow: 6,
        source: 'historical' as const,
        elevationM: 25,
      })),
    )

    vi.mocked(getHistoricalRecordRanges).mockImplementation(async (_lat, _lon, dates) =>
      new Map(dates.map((date) => [date, { recordHigh: 30, recordLow: 6 }])),
    )

    const stop: Stop = {
      id: 'city-of-london',
      city: 'City of London',
      region: 'England, United Kingdom',
      lat: 51.51,
      lon: -0.09,
      startDate: '2024-03-15',
      nights: 16,
    }

    const result = await getDayStats(stop)
    const day15 = result.find((day) => day.date === '2024-03-30')

    expect(day15?.source).toBe('historical')
    expect(day15?.avgHigh).toBe(18) // from the historical mock, not NaN from the null forecast index
  })
})

import type { DayStats, Stop } from '@/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { sanitizeStops, useTripStore } from './trip-store'

const validStop: Stop = {
  id: 'a',
  city: 'Portland',
  region: 'OR',
  lat: 45.5,
  lon: -122.6,
  startDate: '2024-06-01',
  nights: 3,
}

describe('sanitizeStops', () => {
  it('returns an empty array for non-array input', () => {
    expect(sanitizeStops(undefined)).toEqual([])
    expect(sanitizeStops(null)).toEqual([])
    expect(sanitizeStops('not an array')).toEqual([])
    expect(sanitizeStops({ stops: [] })).toEqual([])
  })

  it('keeps well-formed stops', () => {
    expect(sanitizeStops([validStop])).toEqual([validStop])
  })

  it('drops entries missing required fields or with the wrong type', () => {
    const missingCity = { ...validStop, city: undefined }
    const wrongLatType = { ...validStop, lat: '45.5' }
    expect(sanitizeStops([missingCity])).toEqual([])
    expect(sanitizeStops([wrongLatType])).toEqual([])
  })

  it('drops entries with non-finite lat/lon', () => {
    expect(sanitizeStops([{ ...validStop, lat: NaN }])).toEqual([])
    expect(sanitizeStops([{ ...validStop, lon: Infinity }])).toEqual([])
  })

  it('drops entries with a zero or negative nights value', () => {
    expect(sanitizeStops([{ ...validStop, nights: 0 }])).toEqual([])
    expect(sanitizeStops([{ ...validStop, nights: -2 }])).toEqual([])
  })

  it('drops an empty startDate', () => {
    expect(sanitizeStops([{ ...validStop, startDate: '' }])).toEqual([])
  })

  it('filters a mixed array, keeping only the valid stops', () => {
    const invalid = { ...validStop, nights: -1 }
    const other: Stop = { ...validStop, id: 'b' }
    expect(sanitizeStops([validStop, invalid, other])).toEqual([validStop, other])
  })
})

describe('beginFetch/commitDayStats versioning', () => {
  beforeEach(() => {
    useTripStore.setState({ stops: [], dayStats: {} })
  })

  it('drops a stale commit from a fetch generation superseded by a newer one', () => {
    const id = 'stop-versioning'
    const staleVersion = useTripStore.getState().beginFetch(id)
    const latestVersion = useTripStore.getState().beginFetch(id)
    expect(latestVersion).not.toBe(staleVersion)
    expect(useTripStore.getState().dayStats[id]).toBe('loading')

    // The first (now-stale) fetch resolves after the second one started —
    // it must not overwrite the loading state left by the newer fetch.
    useTripStore.getState().commitDayStats(id, staleVersion, 'error')
    expect(useTripStore.getState().dayStats[id]).toBe('loading')

    // The newer fetch resolving does commit.
    const stats: DayStats[] = [
      {
        date: '2024-06-01',
        avgHigh: 20,
        avgLow: 10,
        precipMean: 0,
        wetDayProbability: 0,
        weatherCode: 1,
        recordHigh: 25,
        recordLow: 5,
        source: 'forecast',
        elevationM: 50,
      },
    ]
    useTripStore.getState().commitDayStats(id, latestVersion, stats)
    expect(useTripStore.getState().dayStats[id]).toBe(stats)
  })

  it('commits normally when there is only a single fetch generation', () => {
    const id = 'stop-single-fetch'
    const version = useTripStore.getState().beginFetch(id)
    useTripStore.getState().commitDayStats(id, version, 'rate-limited')
    expect(useTripStore.getState().dayStats[id]).toBe('rate-limited')
  })
})

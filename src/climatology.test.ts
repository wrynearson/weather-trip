import { describe, expect, it } from 'vitest'
import { aggregateHistoricalDay, monthDayWindow } from './climatology'
import type { DailySeries } from './open-meteo'

function makeSeries(overrides: Partial<DailySeries> = {}): DailySeries {
  return {
    time: [],
    tMax: [],
    tMin: [],
    precip: [],
    precipProbabilityMax: [],
    weatherCode: [],
    elevationM: 100,
    ...overrides,
  }
}

describe('monthDayWindow', () => {
  it('wraps from January into the previous December', () => {
    const window = monthDayWindow('2024-01-01', 3)
    expect(window.size).toBe(7)
    expect([...window].sort()).toEqual(['01-01', '01-02', '01-03', '01-04', '12-29', '12-30', '12-31'].sort())
  })

  it('wraps from December into the next January', () => {
    const window = monthDayWindow('2024-12-31', 3)
    expect(window.size).toBe(7)
    expect([...window].sort()).toEqual(['12-28', '12-29', '12-30', '12-31', '01-01', '01-02', '01-03'].sort())
  })

  it('produces a contiguous non-wrapping window mid-month', () => {
    const window = monthDayWindow('2024-07-15', 3)
    expect(window.size).toBe(7)
    expect([...window].sort()).toEqual(
      ['07-12', '07-13', '07-14', '07-15', '07-16', '07-17', '07-18'].sort(),
    )
  })
})

describe('aggregateHistoricalDay', () => {
  it('pools samples from multiple years within the window and ignores samples outside it', () => {
    const series = makeSeries({
      // 2024-07-15 ± 3 days -> 07-12..07-18. The last sample (07-25) falls
      // outside the window and must be excluded from the pool.
      time: ['1991-07-15', '2005-07-14', '2020-07-16', '1999-07-25'],
      tMax: [30, 32, 28, 100],
      tMin: [20, 18, 19, 50],
      precip: [0, 2, 0.5, 999],
      weatherCode: [1, 2, 1, 9],
    })

    const day = aggregateHistoricalDay(series, '2024-07-15')

    expect(day.avgHigh).toBeCloseTo(30) // (30 + 32 + 28) / 3
    expect(day.avgLow).toBeCloseTo(19) // (20 + 18 + 19) / 3
    expect(day.precipMean).toBeCloseTo(0.8333, 3) // (0 + 2 + 0.5) / 3
    expect(day.wetDayProbability).toBeCloseTo(1 / 3) // only the 2mm sample is > 1mm
    expect(day.weatherCode).toBe(1) // mode of [1, 2, 1]
    expect(day.recordHigh).toBe(32)
    expect(day.recordLow).toBe(18)
    expect(day.source).toBe('historical')
  })

  it('produces NaN, not a throw or garbage, for an empty series', () => {
    const series = makeSeries()

    expect(() => aggregateHistoricalDay(series, '2024-07-15')).not.toThrow()
    const day = aggregateHistoricalDay(series, '2024-07-15')

    expect(day.avgHigh).toBeNaN()
    expect(day.avgLow).toBeNaN()
    expect(day.precipMean).toBeNaN()
    expect(day.wetDayProbability).toBeNaN()
    expect(day.weatherCode).toBeNaN()
    expect(day.recordHigh).toBeNaN()
    expect(day.recordLow).toBeNaN()
  })

  it('produces NaN for a sparse day whose only sample has all-null fields', () => {
    const series = makeSeries({
      time: ['2024-07-15'],
      tMax: [null],
      tMin: [null],
      precip: [null],
      weatherCode: [null],
    })

    const day = aggregateHistoricalDay(series, '2024-07-15')

    expect(day.avgHigh).toBeNaN()
    expect(day.avgLow).toBeNaN()
    expect(day.precipMean).toBeNaN()
    expect(day.wetDayProbability).toBeNaN()
    expect(day.weatherCode).toBeNaN()
    expect(day.recordHigh).toBeNaN()
    expect(day.recordLow).toBeNaN()
  })
})

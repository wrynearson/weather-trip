import { describe, expect, it } from 'vitest'
import { daysBetweenISO, formatGap, formatGapShort, gapDaysBetweenStops } from './dates'

describe('daysBetweenISO', () => {
  it('counts whole days, including across month and year ends', () => {
    expect(daysBetweenISO('2027-04-10', '2027-04-13')).toBe(3)
    expect(daysBetweenISO('2026-12-31', '2027-01-02')).toBe(2)
  })

  it('is negative when the second date is earlier', () => {
    expect(daysBetweenISO('2027-04-13', '2027-04-10')).toBe(-3)
  })
})

describe('gapDaysBetweenStops', () => {
  it('is 0 for back-to-back stops', () => {
    expect(gapDaysBetweenStops({ startDate: '2027-04-10', nights: 3 }, { startDate: '2027-04-13' })).toBe(0)
  })

  it('counts days between the end of one stop and the start of the next', () => {
    expect(gapDaysBetweenStops({ startDate: '2027-04-10', nights: 3 }, { startDate: '2027-04-20' })).toBe(7)
  })

  it('treats 0 nights as 1, matching how stop dates are displayed', () => {
    expect(gapDaysBetweenStops({ startDate: '2027-04-10', nights: 0 }, { startDate: '2027-04-12' })).toBe(1)
  })

  it('is negative when stops overlap', () => {
    expect(gapDaysBetweenStops({ startDate: '2027-04-10', nights: 5 }, { startDate: '2027-04-12' })).toBe(-3)
  })
})

describe('formatGap / formatGapShort', () => {
  it.each([
    [1, '1 day between stops', '1d'],
    [13, '13 days between stops', '13d'],
    [14, '2 weeks between stops', '2w'],
    [59, '8 weeks between stops', '8w'],
    [60, '2 months between stops', '2mo'],
    [128, '4 months between stops', '4mo'],
    [334, '11 months between stops', '11mo'],
    [335, '1 year between stops', '1y'],
    [400, '1 year between stops', '1y'],
    [600, '1.5 years between stops', '1.5y'],
    [800, '2 years between stops', '2y'],
  ])('%i days → "%s" / "%s"', (days, long, short) => {
    expect(formatGap(days)).toBe(long)
    expect(formatGapShort(days)).toBe(short)
  })
})

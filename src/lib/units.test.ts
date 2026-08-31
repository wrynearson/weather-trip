import { describe, expect, it } from 'vitest'
import { celsiusToDisplay, formatPercent, formatPrecip, formatTemp } from './units'

describe('celsiusToDisplay', () => {
  it('passes Celsius through unrounded input as a rounded integer', () => {
    expect(celsiusToDisplay(20.4, 'C')).toBe(20)
    expect(celsiusToDisplay(20.6, 'C')).toBe(21)
  })

  it('converts Celsius to Fahrenheit', () => {
    expect(celsiusToDisplay(0, 'F')).toBe(32)
    expect(celsiusToDisplay(100, 'F')).toBe(212)
    expect(celsiusToDisplay(37, 'F')).toBe(99) // 98.6 rounds up
  })
})

describe('formatTemp', () => {
  it('renders NaN as an em dash regardless of units', () => {
    expect(formatTemp(NaN, 'C')).toBe('—')
    expect(formatTemp(NaN, 'F')).toBe('—')
  })

  it('formats a real value with the unit suffix', () => {
    expect(formatTemp(20, 'C')).toBe('20°C')
    expect(formatTemp(0, 'F')).toBe('32°F')
  })
})

describe('formatPrecip', () => {
  it('renders NaN as an em dash regardless of units', () => {
    expect(formatPrecip(NaN, 'C')).toBe('—')
    expect(formatPrecip(NaN, 'F')).toBe('—')
  })

  it('formats millimeters for metric units', () => {
    expect(formatPrecip(10, 'C')).toBe('10mm')
  })

  it('converts to inches for imperial units', () => {
    expect(formatPrecip(25.4, 'F')).toBe('1.00"')
  })
})

describe('formatPercent', () => {
  it('renders NaN as an em dash', () => {
    expect(formatPercent(NaN)).toBe('—')
  })

  it('formats a fraction as a rounded percentage', () => {
    expect(formatPercent(0.5)).toBe('50%')
    expect(formatPercent(1)).toBe('100%')
    expect(formatPercent(0)).toBe('0%')
  })
})

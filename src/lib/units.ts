import type { Units } from '@/types'

export function celsiusToDisplay(celsius: number, units: Units): number {
  return Math.round(units === 'F' ? (celsius * 9) / 5 + 32 : celsius)
}

// "—" for NaN — a day with no usable samples (e.g. a sparse historical
// archive gap) rather than a literal "NaN°" shown to the user.
export function formatTemp(celsius: number, units: Units): string {
  if (Number.isNaN(celsius)) return '—'
  return `${celsiusToDisplay(celsius, units)}°${units}`
}

const METERS_PER_FOOT = 0.3048

export function formatElevation(elevationM: number, units: Units): string {
  if (units === 'F') {
    return `${Math.round(elevationM / METERS_PER_FOOT).toLocaleString()} ft`
  }
  return `${Math.round(elevationM).toLocaleString()} m`
}

const MM_PER_INCH = 25.4

export function formatPrecip(mm: number, units: Units): string {
  if (Number.isNaN(mm)) return '—'
  if (units === 'F') {
    return `${(mm / MM_PER_INCH).toFixed(2)}"`
  }
  return `${Math.round(mm)}mm`
}

export function formatPercent(fraction: number): string {
  return Number.isNaN(fraction) ? '—' : `${Math.round(fraction * 100)}%`
}

function signed(n: number, text: string): string {
  return n > 0 ? `+${text}` : n < 0 ? `-${text}` : `±${text}`
}

// A temperature *difference* — scaled for °F but without the +32 offset that
// celsiusToDisplay applies to absolute temperatures.
export function formatTempDelta(deltaCelsius: number, units: Units): string {
  if (Number.isNaN(deltaCelsius)) return '—'
  const value = Math.round(units === 'F' ? (deltaCelsius * 9) / 5 : deltaCelsius)
  return `${signed(value, String(Math.abs(value)))}°${units}`
}

export function formatPrecipDelta(deltaMm: number, units: Units): string {
  if (Number.isNaN(deltaMm)) return '—'
  if (units === 'F') {
    const inches = Math.round((deltaMm / MM_PER_INCH) * 100) / 100
    return signed(inches, `${Math.abs(inches).toFixed(2)}"`)
  }
  const mm = Math.round(deltaMm)
  return signed(mm, `${Math.abs(mm)}mm`)
}

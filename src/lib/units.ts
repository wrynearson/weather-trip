import type { Units } from '@/types'

export function celsiusToDisplay(celsius: number, units: Units): number {
  return Math.round(units === 'F' ? (celsius * 9) / 5 + 32 : celsius)
}

export function formatTemp(celsius: number, units: Units): string {
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
  if (units === 'F') {
    return `${(mm / MM_PER_INCH).toFixed(2)}"`
  }
  return `${Math.round(mm)}mm`
}

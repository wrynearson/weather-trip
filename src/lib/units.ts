import type { Units } from '@/types'

export function celsiusToDisplay(celsius: number, units: Units): number {
  return Math.round(units === 'F' ? (celsius * 9) / 5 + 32 : celsius)
}

export function formatTemp(celsius: number, units: Units): string {
  return `${celsiusToDisplay(celsius, units)}°${units}`
}

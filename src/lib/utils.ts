import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Most frequent value in the array, ties broken by first occurrence.
export function mode<T>(values: T[]): T | undefined {
  let best: T | undefined
  let bestCount = 0
  const counts = new Map<T, number>()
  for (const value of values) {
    const count = (counts.get(value) ?? 0) + 1
    counts.set(value, count)
    if (count > bestCount) {
      bestCount = count
      best = value
    }
  }
  return best
}

// Drops NaN entries (a day with no usable weather data) so one gap doesn't
// poison a min/max/mean computed across several days.
export function validNumbers(values: number[]): number[] {
  return values.filter((v) => !Number.isNaN(v))
}

export function minOrNaN(values: number[]): number {
  return values.length ? Math.min(...values) : NaN
}

export function maxOrNaN(values: number[]): number {
  return values.length ? Math.max(...values) : NaN
}

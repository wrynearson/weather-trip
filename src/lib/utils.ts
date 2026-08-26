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

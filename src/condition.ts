import type { DayStats } from './types'

export type Condition = 'sunny' | 'partly' | 'cloudy' | 'rainy' | 'snowy'

/**
 * Classify a single day's weather based on temperature and precipitation probability.
 * Uses rule-based thresholds to map conditions to observable weather patterns.
 */
export function classifyDay(stats: DayStats): Condition {
  // Snowy: freezing temps + moderate+ precipitation risk
  if (stats.avgHigh <= 0 && stats.wetDayProbability > 0.3) {
    return 'snowy'
  }

  // Rainy: high precipitation probability
  if (stats.wetDayProbability > 0.5) {
    return 'rainy'
  }

  // Cloudy: moderate precipitation probability
  if (stats.wetDayProbability > 0.25) {
    return 'cloudy'
  }

  // Partly cloudy: light precipitation probability
  if (stats.wetDayProbability > 0.1) {
    return 'partly'
  }

  // Sunny: low precipitation probability
  return 'sunny'
}

export type TripBadge = 'sunny' | 'mixed' | 'rainy'

/**
 * Classify an entire trip's overall weather character.
 * Computes the mean precipitation probability across all days (pooled from all stops)
 * to determine if the trip is generally sunny, mixed, or rainy.
 */
export function classifyTrip(allDayStats: DayStats[]): TripBadge {
  if (allDayStats.length === 0) {
    return 'sunny'
  }

  const meanWetProbability =
    allDayStats.reduce((sum, day) => sum + day.wetDayProbability, 0) /
    allDayStats.length

  // High chance of rain: >0.6 mean wet probability
  if (meanWetProbability > 0.6) {
    return 'rainy'
  }

  // Low chance of rain: <=0.3 mean wet probability
  if (meanWetProbability <= 0.3) {
    return 'sunny'
  }

  // Mid-range: mixed conditions
  return 'mixed'
}

export const TRIP_BADGE_LABEL: Record<TripBadge, string> = {
  sunny: 'Generally sunny',
  mixed: 'Mixed conditions',
  rainy: 'Mostly rainy',
}

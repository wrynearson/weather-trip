import type { DayStats } from './types'

// The 28 WMO "WW" weather interpretation codes Open-Meteo reports, used
// verbatim as our condition list instead of collapsing them into broader
// buckets. See https://open-meteo.com/en/docs#weathervariables
export type Condition =
  | 'clear-sky'
  | 'mainly-clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'rime-fog'
  | 'drizzle-light'
  | 'drizzle-moderate'
  | 'drizzle-dense'
  | 'freezing-drizzle-light'
  | 'freezing-drizzle-dense'
  | 'rain-slight'
  | 'rain-moderate'
  | 'rain-heavy'
  | 'freezing-rain-light'
  | 'freezing-rain-heavy'
  | 'snow-slight'
  | 'snow-moderate'
  | 'snow-heavy'
  | 'snow-grains'
  | 'rain-showers-slight'
  | 'rain-showers-moderate'
  | 'rain-showers-violent'
  | 'snow-showers-slight'
  | 'snow-showers-heavy'
  | 'thunderstorm'
  | 'thunderstorm-hail-slight'
  | 'thunderstorm-hail-heavy'

const WEATHER_CODE_CONDITION: Record<number, Condition> = {
  0: 'clear-sky',
  1: 'mainly-clear',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'rime-fog',
  51: 'drizzle-light',
  53: 'drizzle-moderate',
  55: 'drizzle-dense',
  56: 'freezing-drizzle-light',
  57: 'freezing-drizzle-dense',
  61: 'rain-slight',
  63: 'rain-moderate',
  65: 'rain-heavy',
  66: 'freezing-rain-light',
  67: 'freezing-rain-heavy',
  71: 'snow-slight',
  73: 'snow-moderate',
  75: 'snow-heavy',
  77: 'snow-grains',
  80: 'rain-showers-slight',
  81: 'rain-showers-moderate',
  82: 'rain-showers-violent',
  85: 'snow-showers-slight',
  86: 'snow-showers-heavy',
  95: 'thunderstorm',
  96: 'thunderstorm-hail-slight',
  99: 'thunderstorm-hail-heavy',
}

export const CONDITION_LABEL: Record<Condition, string> = {
  'clear-sky': 'Clear sky',
  'mainly-clear': 'Mainly clear',
  'partly-cloudy': 'Partly cloudy',
  overcast: 'Overcast',
  fog: 'Fog',
  'rime-fog': 'Rime fog',
  'drizzle-light': 'Light drizzle',
  'drizzle-moderate': 'Moderate drizzle',
  'drizzle-dense': 'Dense drizzle',
  'freezing-drizzle-light': 'Light freezing drizzle',
  'freezing-drizzle-dense': 'Dense freezing drizzle',
  'rain-slight': 'Slight rain',
  'rain-moderate': 'Moderate rain',
  'rain-heavy': 'Heavy rain',
  'freezing-rain-light': 'Light freezing rain',
  'freezing-rain-heavy': 'Heavy freezing rain',
  'snow-slight': 'Slight snow',
  'snow-moderate': 'Moderate snow',
  'snow-heavy': 'Heavy snow',
  'snow-grains': 'Snow grains',
  'rain-showers-slight': 'Slight rain showers',
  'rain-showers-moderate': 'Moderate rain showers',
  'rain-showers-violent': 'Violent rain showers',
  'snow-showers-slight': 'Slight snow showers',
  'snow-showers-heavy': 'Heavy snow showers',
  thunderstorm: 'Thunderstorm',
  'thunderstorm-hail-slight': 'Thunderstorm, slight hail',
  'thunderstorm-hail-heavy': 'Thunderstorm, heavy hail',
}

/**
 * Maps a day's WMO weather code to its condition. Falls back to 'clear-sky'
 * for a missing/unrecognized code.
 */
export function classifyDay(stats: DayStats): Condition {
  return WEATHER_CODE_CONDITION[stats.weatherCode] ?? 'clear-sky'
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

/**
 * Ranks a stop's nights by how often each condition occurs, most frequent
 * first (e.g. 3 clear-sky + 2 rain-heavy nights -> ['clear-sky', 'rain-heavy']),
 * capped at `limit`. Each night's condition is already classified from its own
 * weather code (or, for historical data, the mode of its 30-year sample) —
 * this only counts and ranks, it doesn't re-derive anything.
 */
export function rankStopConditions(days: DayStats[], limit = 3): Condition[] {
  const counts = new Map<Condition, number>()
  for (const day of days) {
    const condition = classifyDay(day)
    counts.set(condition, (counts.get(condition) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([condition]) => condition)
}

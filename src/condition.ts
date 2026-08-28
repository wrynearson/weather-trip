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

// Groups conditions that differ only by intensity (e.g. rain-slight vs.
// rain-heavy are both "rain") so overview icon rows show one icon per
// weather phenomenon instead of one per intensity tier. Distinct phenomena
// — rain vs. rain showers, drizzle vs. freezing drizzle, fog vs. rime fog —
// still count separately.
const CONDITION_FAMILY: Record<Condition, string> = {
  'clear-sky': 'clear-sky',
  'mainly-clear': 'mainly-clear',
  'partly-cloudy': 'partly-cloudy',
  overcast: 'overcast',
  fog: 'fog',
  'rime-fog': 'fog',
  'drizzle-light': 'drizzle',
  'drizzle-moderate': 'drizzle',
  'drizzle-dense': 'drizzle',
  'freezing-drizzle-light': 'freezing-drizzle',
  'freezing-drizzle-dense': 'freezing-drizzle',
  'rain-slight': 'rain',
  'rain-moderate': 'rain',
  'rain-heavy': 'rain',
  'freezing-rain-light': 'freezing-rain',
  'freezing-rain-heavy': 'freezing-rain',
  'snow-slight': 'snow',
  'snow-moderate': 'snow',
  'snow-heavy': 'snow',
  'snow-grains': 'snow-grains',
  'rain-showers-slight': 'rain-showers',
  'rain-showers-moderate': 'rain-showers',
  'rain-showers-violent': 'rain-showers',
  'snow-showers-slight': 'snow-showers',
  'snow-showers-heavy': 'snow-showers',
  thunderstorm: 'thunderstorm',
  'thunderstorm-hail-slight': 'thunderstorm',
  'thunderstorm-hail-heavy': 'thunderstorm',
}

// The condition used to represent each family's icon/label — its most
// typical (usually moderate) intensity, not whichever exact code happened
// to be most common.
const FAMILY_REPRESENTATIVE: Record<string, Condition> = {
  'clear-sky': 'clear-sky',
  'mainly-clear': 'mainly-clear',
  'partly-cloudy': 'partly-cloudy',
  overcast: 'overcast',
  fog: 'fog',
  drizzle: 'drizzle-moderate',
  'freezing-drizzle': 'freezing-drizzle-light',
  rain: 'rain-moderate',
  'freezing-rain': 'freezing-rain-light',
  snow: 'snow-moderate',
  'snow-grains': 'snow-grains',
  'rain-showers': 'rain-showers-moderate',
  'snow-showers': 'snow-showers-slight',
  thunderstorm: 'thunderstorm',
}

export type RankedCondition = {
  condition: Condition
  frequency: number // share of days in this family, 0-1
}

/**
 * Ranks days by how often each weather family occurs, most frequent first
 * (e.g. 3 clear-sky + 2 rain-heavy + 1 rain-slight nights -> ['clear-sky',
 * 'rain']), capped at `limit`. Intensity is ignored when grouping — rain at
 * any severity counts as one "rain" family — so the result reads as the
 * trip's or stop's dominant weather, not a list of every code that occurred.
 */
export function rankConditions(days: DayStats[], limit = 3): RankedCondition[] {
  const counts = new Map<string, number>()
  for (const day of days) {
    const family = CONDITION_FAMILY[classifyDay(day)]
    counts.set(family, (counts.get(family) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([family, count]) => ({
      condition: FAMILY_REPRESENTATIVE[family],
      frequency: count / days.length,
    }))
}

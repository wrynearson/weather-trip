import { readLocalCache, writeLocalCache } from './lib/local-cache'

export type DailySeries = {
  time: string[]
  tMax: (number | null)[]
  tMin: (number | null)[]
  precip: (number | null)[]
  // Only present on forecast responses — the historical archive API has no
  // probability field, since it returns observed values, not predictions.
  precipProbabilityMax: (number | null)[]
  weatherCode: (number | null)[]
  elevationM: number
}

type OpenMeteoDailyResponse = {
  elevation: number
  daily: {
    time: string[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_sum: (number | null)[]
    precipitation_probability_max?: (number | null)[]
    weathercode: (number | null)[]
  }
}

export class HttpError extends Error {
  status: number

  constructor(status: number) {
    super(`Open-Meteo request failed: ${status}`)
    this.status = status
  }
}

export function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`
}

export async function fetchDailySeries(url: URL): Promise<DailySeries> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new HttpError(response.status)
  }
  const data = (await response.json()) as OpenMeteoDailyResponse
  return {
    time: data.daily.time,
    tMax: data.daily.temperature_2m_max,
    tMin: data.daily.temperature_2m_min,
    precip: data.daily.precipitation_sum,
    precipProbabilityMax: data.daily.precipitation_probability_max ?? [],
    weatherCode: data.daily.weathercode,
    elevationM: data.elevation,
  }
}

export function mean(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : NaN
}

/**
 * Like fetchDailySeries, but persists the result to localStorage and serves
 * from there when it's still fresh — skipping the network call entirely — or
 * when a fresh fetch fails (rate limit, offline, etc). Stale data is only
 * ever replaced by a successful fetch, never dropped just for being old, so
 * a 429 degrades to "slightly outdated" instead of an error state.
 */
export async function fetchDailySeriesCached(
  url: URL,
  storageKey: string,
  freshMs: number,
): Promise<DailySeries> {
  const cached = readLocalCache<DailySeries>(storageKey)
  if (cached && Date.now() - cached.storedAt < freshMs) {
    return cached.value
  }

  try {
    const series = await fetchDailySeries(url)
    writeLocalCache(storageKey, series)
    return series
  } catch (error) {
    if (cached) return cached.value
    throw error
  }
}

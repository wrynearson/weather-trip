export type DailySeries = {
  time: string[]
  tMax: (number | null)[]
  tMin: (number | null)[]
  precip: (number | null)[]
  elevationM: number
}

type OpenMeteoDailyResponse = {
  elevation: number
  daily: {
    time: string[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_sum: (number | null)[]
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
    elevationM: data.elevation,
  }
}

export function mean(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : NaN
}

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { Stop, Units } from '@/types'
import { generateStopId } from '@/store/trip-store'

const SCHEMA_VERSION = 1

// [city, region, lat, lon, startDate, nights] — id is intentionally omitted;
// the sender's id is meaningless to the recipient and is regenerated on decode.
type StopTuple = [string, string, number, number, string, number]
type TripPayload = { v: number; u: string; s: StopTuple[] }

function roundCoord(value: number): number {
  return Math.round(value * 10000) / 10000
}

export function encodeTripToParam(stops: Stop[], units: Units): string {
  const payload: TripPayload = {
    v: SCHEMA_VERSION,
    u: units,
    s: stops.map((stop) => [
      stop.city,
      stop.region,
      roundCoord(stop.lat),
      roundCoord(stop.lon),
      stop.startDate,
      stop.nights,
    ]),
  }
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

function toStop(entry: unknown): Stop | null {
  if (!Array.isArray(entry) || entry.length !== 6) return null
  const [city, region, lat, lon, startDate, nights] = entry as unknown[]

  if (typeof city !== 'string') return null
  if (typeof region !== 'string') return null
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) return null
  if (typeof lon !== 'number' || !Number.isFinite(lon) || lon < -180 || lon > 180) return null
  if (typeof startDate !== 'string' || startDate.length === 0) return null
  if (typeof nights !== 'number' || !Number.isFinite(nights) || nights <= 0) return null

  return { id: generateStopId(), city, region, lat, lon, startDate, nights }
}

export function decodeTripFromParam(param: string): { stops: Stop[]; units: Units } | null {
  const decompressed = decompressFromEncodedURIComponent(param)
  if (!decompressed) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(decompressed)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const payload = parsed as Record<string, unknown>

  if (payload.v !== SCHEMA_VERSION) return null
  if (payload.u !== 'C' && payload.u !== 'F') return null
  if (!Array.isArray(payload.s)) return null

  const stops: Stop[] = []
  for (const entry of payload.s) {
    const stop = toStop(entry)
    if (!stop) return null
    stops.push(stop)
  }

  return { stops, units: payload.u }
}

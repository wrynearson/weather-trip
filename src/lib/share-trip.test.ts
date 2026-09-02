import { compressToEncodedURIComponent } from 'lz-string'
import { describe, expect, it } from 'vitest'
import type { Stop } from '@/types'
import { decodeTripFromParam, encodeTripToParam } from './share-trip'

const stops: Stop[] = [
  {
    id: 'original-id-1',
    city: 'Portland',
    region: 'OR',
    lat: 45.52346,
    lon: -122.67654,
    startDate: '2024-06-01',
    nights: 3,
  },
  {
    id: 'original-id-2',
    city: 'Tokyo',
    region: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    startDate: '2024-06-10',
    nights: 5,
  },
]

describe('encodeTripToParam / decodeTripFromParam', () => {
  it('round-trips stops (minus id) and units through encode/decode', () => {
    const encoded = encodeTripToParam(stops, 'F')
    const decoded = decodeTripFromParam(encoded)

    expect(decoded).not.toBeNull()
    expect(decoded!.units).toBe('F')
    expect(decoded!.stops).toHaveLength(2)
    expect(decoded!.stops.map(({ id: _id, ...rest }) => rest)).toEqual([
      { city: 'Portland', region: 'OR', lat: 45.5235, lon: -122.6765, startDate: '2024-06-01', nights: 3 },
      { city: 'Tokyo', region: 'Japan', lat: 35.6762, lon: 139.6503, startDate: '2024-06-10', nights: 5 },
    ])
  })

  it("regenerates stop ids on decode rather than reusing the sender's", () => {
    const encoded = encodeTripToParam(stops, 'C')
    const decoded = decodeTripFromParam(encoded)

    expect(decoded!.stops[0].id).not.toBe('original-id-1')
    expect(decoded!.stops[1].id).not.toBe('original-id-2')
    expect(decoded!.stops[0].id).not.toBe(decoded!.stops[1].id)
  })

  it('rounds lat/lon to 4 decimal places on encode', () => {
    const encoded = encodeTripToParam(
      [{ ...stops[0], lat: 45.123456789, lon: -122.987654321 }],
      'C',
    )
    const decoded = decodeTripFromParam(encoded)
    expect(decoded!.stops[0].lat).toBe(45.1235)
    expect(decoded!.stops[0].lon).toBe(-122.9877)
  })

  it('returns null for garbage input', () => {
    expect(decodeTripFromParam('not-a-valid-lz-string-payload!!!')).toBeNull()
  })

  it('returns null for a tampered/truncated compressed string', () => {
    const encoded = encodeTripToParam(stops, 'C')
    expect(decodeTripFromParam(encoded.slice(0, -5))).toBeNull()
  })

  it('returns null when the schema version does not match', () => {
    const badPayload = JSON.stringify({ v: 2, u: 'C', s: [] })
    expect(decodeTripFromParam(compressToEncodedURIComponent(badPayload))).toBeNull()
  })

  it('returns null when a stop tuple has the wrong arity or types', () => {
    const tooShort = compressToEncodedURIComponent(
      JSON.stringify({ v: 1, u: 'C', s: [['Portland', 'OR', 45.5, -122.6]] }),
    )
    const wrongType = compressToEncodedURIComponent(
      JSON.stringify({ v: 1, u: 'C', s: [['Portland', 'OR', 'not-a-number', -122.6, '2024-06-01', 3]] }),
    )
    expect(decodeTripFromParam(tooShort)).toBeNull()
    expect(decodeTripFromParam(wrongType)).toBeNull()
  })

  it('returns null for out-of-range coordinates or non-positive nights', () => {
    const badLat = compressToEncodedURIComponent(
      JSON.stringify({ v: 1, u: 'C', s: [['X', 'Y', 999, 0, '2024-06-01', 1]] }),
    )
    const zeroNights = compressToEncodedURIComponent(
      JSON.stringify({ v: 1, u: 'C', s: [['X', 'Y', 0, 0, '2024-06-01', 0]] }),
    )
    expect(decodeTripFromParam(badLat)).toBeNull()
    expect(decodeTripFromParam(zeroNights)).toBeNull()
  })

  it('returns null when units is not C or F', () => {
    const badUnits = compressToEncodedURIComponent(JSON.stringify({ v: 1, u: 'K', s: [] }))
    expect(decodeTripFromParam(badUnits)).toBeNull()
  })

  it('rejects the whole payload if any single stop is malformed', () => {
    const mixed = compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        u: 'C',
        s: [
          ['Portland', 'OR', 45.5, -122.6, '2024-06-01', 3],
          ['Bad', 'Row', 999, 0, '2024-06-02', 1],
        ],
      }),
    )
    expect(decodeTripFromParam(mixed)).toBeNull()
  })
})

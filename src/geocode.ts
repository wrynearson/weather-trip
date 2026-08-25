export type GeocodeResult = {
  name: string
  region: string
  lat: number
  lon: number
}

type NominatimAddress = {
  city?: string
  town?: string
  village?: string
  province?: string
  state?: string
  country?: string
}

type NominatimResult = {
  name?: string
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const RESULT_LIMIT = 6
const DEBOUNCE_MS = 300

let debounceTimer: ReturnType<typeof setTimeout> | undefined
let activeController: AbortController | undefined

/**
 * Debounced Nominatim search. Only the most recently requested call resolves
 * with real results — any call superseded by a newer one before it settles
 * never resolves, so callers only need to handle the latest response.
 */
export function searchLocations(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim()

  if (debounceTimer) clearTimeout(debounceTimer)
  activeController?.abort()

  if (!trimmed) {
    return Promise.resolve([])
  }

  return new Promise((resolve) => {
    debounceTimer = setTimeout(() => {
      const controller = new AbortController()
      activeController = controller

      const url = new URL(SEARCH_URL)
      url.searchParams.set('format', 'json')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('limit', String(RESULT_LIMIT))
      url.searchParams.set('q', trimmed)

      fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
        .then((response) => (response.ok ? response.json() : []))
        .then((data: unknown) => {
          resolve(Array.isArray(data) ? data.slice(0, RESULT_LIMIT).map(toGeocodeResult) : [])
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          resolve([])
        })
    }, DEBOUNCE_MS)
  })
}

function toGeocodeResult(raw: NominatimResult): GeocodeResult {
  const address = raw.address ?? {}
  const name =
    address.city ??
    address.town ??
    address.village ??
    address.province ??
    raw.name ??
    raw.display_name.split(',')[0]

  return {
    name,
    region: address.country ?? '',
    lat: Number(raw.lat),
    lon: Number(raw.lon),
  }
}

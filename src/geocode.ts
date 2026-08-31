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
  country_code?: string
  'ISO3166-2-lvl4'?: string
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
 * never resolves (nor rejects), so callers only need to handle the latest
 * response. A genuine fetch failure (network error, non-2xx status) rejects
 * so callers can tell "search failed" apart from "no matches".
 */
export function searchLocations(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim()

  if (debounceTimer) clearTimeout(debounceTimer)
  activeController?.abort()

  if (!trimmed) {
    return Promise.resolve([])
  }

  return new Promise((resolve, reject) => {
    debounceTimer = setTimeout(() => {
      const controller = new AbortController()
      activeController = controller

      const url = new URL(SEARCH_URL)
      url.searchParams.set('format', 'json')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('limit', String(RESULT_LIMIT))
      url.searchParams.set('q', trimmed)

      fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Nominatim search failed: ${response.status}`)
          return response.json()
        })
        .then((data: unknown) => {
          resolve(Array.isArray(data) ? data.slice(0, RESULT_LIMIT).map(toGeocodeResult) : [])
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return
          reject(error instanceof Error ? error : new Error('Nominatim search failed'))
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
    region: [admin1Label(address), address.country].filter(Boolean).join(', '),
    lat: Number(raw.lat),
    lon: Number(raw.lon),
  }
}

// Distinguishes same-named places (e.g. "Santa Cruz" in CA vs. NM vs. Bolivia)
// by adding the state/province. US results get the familiar 2-letter postal
// abbreviation (from the ISO 3166-2 code Nominatim returns); everywhere else
// that abbreviation isn't widely recognized, so the full name is used instead.
function admin1Label(address: NominatimAddress): string | undefined {
  const state = address.state ?? address.province
  if (!state) return undefined
  if (address.country_code === 'us') {
    const code = address['ISO3166-2-lvl4']?.split('-')[1]
    if (code?.length === 2) return code
  }
  return state
}

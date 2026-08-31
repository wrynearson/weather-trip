import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayStats, Stop, Units } from '@/types'

export type DayStatsState = DayStats[] | 'loading' | 'error' | 'rate-limited'

// crypto.randomUUID() only exists in secure contexts (HTTPS, or localhost) —
// testing over a LAN IP on a phone is unauthenticated http, where it's
// missing entirely and throws. crypto.getRandomValues has no such
// restriction, so build an id from that instead.
function generateStopId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function isValidStop(value: unknown): value is Stop {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.city === 'string' &&
    typeof s.region === 'string' &&
    typeof s.lat === 'number' &&
    Number.isFinite(s.lat) &&
    typeof s.lon === 'number' &&
    Number.isFinite(s.lon) &&
    typeof s.startDate === 'string' &&
    s.startDate.length > 0 &&
    typeof s.nights === 'number' &&
    Number.isFinite(s.nights) &&
    s.nights > 0
  )
}

export function sanitizeStops(value: unknown): Stop[] {
  if (!Array.isArray(value)) return []
  return value.filter(isValidStop)
}

// Shape actually written to localStorage (see `partialize` below).
type PersistedTripState = { stops: Stop[]; units: Units }

type TripState = {
  stops: Stop[]
  dayStats: Record<string, DayStatsState>
  units: Units
  addStop: () => string
  updateStop: (id: string, patch: Partial<Omit<Stop, 'id'>>) => void
  removeStop: (id: string) => void
  setUnits: (units: Units) => void
  // Starts a new fetch "generation" for a stop: bumps its request version,
  // marks it loading, and returns the version so the caller can later check
  // whether its own fetch is still the latest before committing a result.
  beginFetch: (id: string) => number
  // Commits a fetch result only if `version` is still the latest one issued
  // for `id` — otherwise a slower, older fetch is silently dropped instead
  // of overwriting a newer result (see ticket 002).
  commitDayStats: (id: string, version: number, state: DayStatsState) => void
  clearTrip: () => void
}

// Latest fetch-request version per stop id. Internal bookkeeping only —
// intentionally not part of TripState/DayStatsState, so consumer components
// (stop-card, trip-summary-card, trip-range-chart) never see it and keep
// reading `dayStats` exactly as before.
const fetchVersions: Record<string, number> = {}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      stops: [],
      dayStats: {},
      units: 'C',

      addStop: () => {
        const id = generateStopId()
        const stop: Stop = {
          id,
          city: '',
          region: '',
          lat: 0,
          lon: 0,
          startDate: '',
          nights: 1,
        }
        set((state) => ({ stops: [...state.stops, stop] }))
        return id
      },

      updateStop: (id, patch) => {
        set((state) => ({
          stops: state.stops.map((stop) =>
            stop.id === id ? { ...stop, ...patch } : stop,
          ),
        }))
      },

      removeStop: (id) => {
        set((state) => {
          const { [id]: _removed, ...dayStats } = state.dayStats
          return {
            stops: state.stops.filter((stop) => stop.id !== id),
            dayStats,
          }
        })
      },

      setUnits: (units) => set({ units }),

      beginFetch: (id) => {
        const version = (fetchVersions[id] ?? 0) + 1
        fetchVersions[id] = version
        set((prev) => ({ dayStats: { ...prev.dayStats, [id]: 'loading' } }))
        return version
      },

      commitDayStats: (id, version, state) => {
        // A newer fetch for this stop id has started since this one began —
        // this result is stale, so drop it instead of overwriting.
        if (fetchVersions[id] !== version) return
        set((prev) => ({ dayStats: { ...prev.dayStats, [id]: state } }))
      },

      clearTrip: () => set({ stops: [], dayStats: {} }),
    }),
    {
      name: 'weather-trip:v1',
      version: 1,
      partialize: (state) => ({ stops: state.stops, units: state.units }),
      // No schema changes yet — this is a no-op seam so future breaking
      // changes to the persisted shape have somewhere to add a migration.
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<PersistedTripState>
        return {
          stops: sanitizeStops(persisted.stops),
          units: persisted.units === 'F' ? 'F' : 'C',
        }
      },
      // Runs on every rehydration (not just version bumps), so this is
      // where we validate localStorage contents rather than trusting them:
      // manual edits, partial writes, or a future schema change could hand
      // us malformed stops otherwise (ticket 005).
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<PersistedTripState>
        return {
          ...currentState,
          stops: sanitizeStops(persisted.stops),
          units: persisted.units === 'F' ? 'F' : 'C',
        }
      },
    },
  ),
)

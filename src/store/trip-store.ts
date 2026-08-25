import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayStats, Stop, Units } from '@/types'

export type DayStatsState = DayStats[] | 'loading' | 'error'

type TripState = {
  stops: Stop[]
  dayStats: Record<string, DayStatsState>
  units: Units
  addStop: () => string
  updateStop: (id: string, patch: Partial<Omit<Stop, 'id'>>) => void
  removeStop: (id: string) => void
  setUnits: (units: Units) => void
  setDayStats: (id: string, state: DayStatsState) => void
  clearTrip: () => void
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      stops: [],
      dayStats: {},
      units: 'C',

      addStop: () => {
        const id = crypto.randomUUID()
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

      setDayStats: (id, state) => {
        set((prev) => ({ dayStats: { ...prev.dayStats, [id]: state } }))
      },

      clearTrip: () => set({ stops: [], dayStats: {} }),
    }),
    {
      name: 'weather-trip:v1',
      partialize: (state) => ({ stops: state.stops, units: state.units }),
    },
  ),
)

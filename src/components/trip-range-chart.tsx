import { lazy } from 'react'
import type { Stop } from '@/types'
import type { DayStatsState } from '@/store/trip-store'

// The actual chart implementation lives in trip-range-chart-inner.tsx and
// pulls in recharts, which is a big chunk of bundle weight. It's only ever
// needed once a trip has 2+ resolved days (see shouldShowTripRangeChart
// below), so it's loaded lazily here to keep recharts out of the main
// bundle for everyone who hasn't gotten that far yet.
export const TripRangeChart = lazy(() => import('@/components/trip-range-chart-inner'))

export function shouldShowTripRangeChart(stops: Stop[], dayStats: Record<string, DayStatsState>): boolean {
  const totalDays = stops.reduce((sum, stop) => {
    const days = dayStats[stop.id]
    return sum + (Array.isArray(days) ? days.length : 0)
  }, 0)
  return totalDays >= 2
}

export function ChartLegend() {
  return (
    <div className="flex items-center gap-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
      <span className="flex items-center gap-1" title="Historical range">
        <span className="inline-block size-1.5 rounded-sm bg-muted-foreground/30" />
        <span className="hidden sm:inline">historical range</span>
      </span>
      <span className="flex items-center gap-1" title="Avg min/max">
        <span className="inline-block size-1.5 rounded-sm bg-muted-foreground/60" />
        <span className="hidden sm:inline">avg min/max</span>
      </span>
    </div>
  )
}

import { useTripStore } from '@/store/trip-store'
import { Card, CardContent } from '@/components/ui/card'
import { ChartLegend, TripRangeChart, shouldShowTripRangeChart } from '@/components/trip-range-chart'
import { ConditionIcon } from '@/components/condition-icon'
import { CONDITION_LABEL, rankConditions } from '@/condition'
import { formatTemp } from '@/lib/units'
import type { DayStats } from '@/types'

export function TripSummaryCard() {
  const { stops, dayStats, units } = useTripStore()

  const resolvedDayStats = Object.values(dayStats).filter(
    (value): value is DayStats[] => Array.isArray(value),
  )
  const allDays = resolvedDayStats.flat()

  if (allDays.length === 0) return null

  const topConditions = rankConditions(allDays)
  const low = Math.min(...allDays.map((day) => day.avgLow))
  const high = Math.max(...allDays.map((day) => day.avgHigh))

  return (
    <Card className="sticky top-0 z-10 shadow-lg">
      <CardContent>
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              {topConditions.map((condition) => (
                <ConditionIcon key={condition} condition={condition} title={CONDITION_LABEL[condition]} />
              ))}
            </span>
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-muted-foreground">Trip low</span>
              <span className="font-mono font-medium">{formatTemp(low, units)}</span>
            </div>
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-muted-foreground">Trip high</span>
              <span className="font-mono font-medium">{formatTemp(high, units)}</span>
            </div>
          </div>
          <div className="absolute left-1/2 hidden -translate-x-1/2 text-sm text-muted-foreground sm:block">
            {allDays.length} {allDays.length === 1 ? 'day' : 'days'} · {stops.length}{' '}
            {stops.length === 1 ? 'stop' : 'stops'}
          </div>
          <div className="shrink-0">{shouldShowTripRangeChart(stops, dayStats) && <ChartLegend />}</div>
        </div>
        <TripRangeChart stops={stops} dayStats={dayStats} units={units} />
      </CardContent>
    </Card>
  )
}

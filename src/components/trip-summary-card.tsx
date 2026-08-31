import { Suspense } from 'react'
import { useTripStore } from '@/store/trip-store'
import { Card, CardContent } from '@/components/ui/card'
import { ChartLegend, TripRangeChart, shouldShowTripRangeChart } from '@/components/trip-range-chart'
import { ConditionIcon } from '@/components/condition-icon'
import { CONDITION_LABEL, rankConditions } from '@/condition'
import { formatTemp } from '@/lib/units'
import { maxOrNaN, minOrNaN, validNumbers } from '@/lib/utils'
import type { DayStats } from '@/types'

export function TripSummaryCard() {
  const { stops, dayStats, units } = useTripStore()

  const resolvedDayStats = Object.values(dayStats).filter(
    (value): value is DayStats[] => Array.isArray(value),
  )
  const allDays = resolvedDayStats.flat()

  if (allDays.length === 0) return null

  const topConditions = rankConditions(allDays)
  const low = minOrNaN(validNumbers(allDays.map((day) => day.avgLow)))
  const high = maxOrNaN(validNumbers(allDays.map((day) => day.avgHigh)))

  return (
    <Card className="sticky top-0 z-10 shadow-lg">
      <CardContent>
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              {topConditions.map(({ condition, frequency }) => (
                <ConditionIcon
                  key={condition}
                  condition={condition}
                  title={`${CONDITION_LABEL[condition]} · ${Math.round(frequency * 100)}%`}
                />
              ))}
            </span>
            <div className="flex items-baseline gap-1.5 text-sm whitespace-nowrap">
              <span className="text-muted-foreground">Trip low</span>
              <span className="font-mono font-medium">{formatTemp(low, units)}</span>
            </div>
            <div className="flex items-baseline gap-1.5 text-sm whitespace-nowrap">
              <span className="text-muted-foreground">Trip high</span>
              <span className="font-mono font-medium">{formatTemp(high, units)}</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            {allDays.length} {allDays.length === 1 ? 'day' : 'days'} · {stops.length}{' '}
            {stops.length === 1 ? 'stop' : 'stops'}
          </div>
          <div className="shrink-0 self-end sm:self-auto">
            {shouldShowTripRangeChart(stops, dayStats) && <ChartLegend />}
          </div>
        </div>
        <Suspense fallback={null}>
          <TripRangeChart stops={stops} dayStats={dayStats} units={units} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

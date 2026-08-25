import { useTripStore } from '@/store/trip-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { classifyTrip, TRIP_BADGE_LABEL, type TripBadge } from '@/condition'
import { formatTemp } from '@/lib/units'
import type { DayStats } from '@/types'

const BADGE_VARIANT: Record<TripBadge, 'default' | 'secondary' | 'outline'> = {
  sunny: 'default',
  mixed: 'secondary',
  rainy: 'outline',
}

export function TripSummaryCard() {
  const { stops, dayStats, units } = useTripStore()

  const resolvedDayStats = Object.values(dayStats).filter(
    (value): value is DayStats[] => Array.isArray(value),
  )
  const allDays = resolvedDayStats.flat()

  if (allDays.length === 0) return null

  const badge = classifyTrip(allDays)
  const low = Math.min(...allDays.map((day) => day.avgLow))
  const high = Math.max(...allDays.map((day) => day.avgHigh))

  return (
    <>
      <Card className="sticky top-0 z-10 shadow-lg">
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant={BADGE_VARIANT[badge]}>{TRIP_BADGE_LABEL[badge]}</Badge>
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-muted-foreground">Trip low</span>
              <span className="font-mono font-medium">{formatTemp(low, units)}</span>
            </div>
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-muted-foreground">Trip high</span>
              <span className="font-mono font-medium">{formatTemp(high, units)}</span>
            </div>
          </div>
          <div className="shrink-0 text-sm text-muted-foreground">
            {stops.length} {stops.length === 1 ? 'stop' : 'stops'}
          </div>
        </CardContent>
      </Card>
      {/* Range chart (issue #9) renders here once >=2 stops exist */}
    </>
  )
}

import { Pencil } from 'lucide-react'
import type { DayStats, Stop, Units } from '@/types'
import type { DayStatsState } from '@/store/trip-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConditionIcon } from '@/components/condition-icon'
import { StopEditor, type StopDraft } from '@/components/stop-editor'
import { CONDITION_LABEL, rankConditions } from '@/condition'
import { formatElevation, formatPercent, formatTemp } from '@/lib/units'
import { formatDateRange, formatNights } from '@/lib/dates'
import { daysUntil } from '@/forecast'
import { mean } from '@/open-meteo'
import { validNumbers } from '@/lib/utils'

type StopCardProps = {
  stop: Stop
  dayStatsState: DayStatsState | undefined
  units: Units
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (draft: StopDraft) => void
  onDelete: () => void
  onRetry: () => void
}

export function StopCard({
  stop,
  dayStatsState,
  units,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onRetry,
}: StopCardProps) {
  if (isEditing) {
    return (
      <StopEditor
        heading="Edit stop"
        initial={{
          query: stop.city,
          picked: stop.city ? { name: stop.city, region: stop.region, lat: stop.lat, lon: stop.lon } : null,
          startDate: stop.startDate,
          nights: stop.nights,
        }}
        onCancel={onCancelEdit}
        onSave={onSave}
        onDelete={onDelete}
      />
    )
  }

  if (dayStatsState === undefined || dayStatsState === 'loading') {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="font-medium">{stop.city}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {stop.region} · looking up averages…
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-2.5 w-14 animate-pulse rounded bg-muted" />
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (dayStatsState === 'error' || dayStatsState === 'rate-limited') {
    const message =
      dayStatsState === 'rate-limited'
        ? "We're being rate-limited by the weather service. Wait a moment, then"
        : "Couldn't load weather for this stop."
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="font-medium">{stop.city}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {message}{' '}
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer border-0 bg-transparent p-0 text-primary underline decoration-1 underline-offset-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const days: DayStats[] = dayStatsState
  const avgHigh = mean(validNumbers(days.map((d) => d.avgHigh)))
  const avgLow = mean(validNumbers(days.map((d) => d.avgLow)))
  const wetDayProbability = mean(validNumbers(days.map((d) => d.wetDayProbability)))
  const topConditions = rankConditions(days)
  // A long stay can straddle the forecast/historical boundary (see
  // forecast.ts getDayStats) — reflect that in the badge instead of only
  // looking at the first night's source.
  const hasForecast = days.some((d) => d.source === 'forecast')
  const hasHistorical = days.some((d) => d.source === 'historical')
  const sourceLabel =
    hasForecast && hasHistorical
      ? `Forecast + historical · ${daysUntil(stop.startDate)}d out`
      : hasForecast
        ? `Forecast · ${daysUntil(stop.startDate)}d out`
        : 'Historical avg'

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">{stop.city}</span>
            <span className="flex items-center gap-1">
              {topConditions.map(({ condition, frequency }) => (
                <ConditionIcon
                  key={condition}
                  condition={condition}
                  title={`${CONDITION_LABEL[condition]} · ${Math.round(frequency * 100)}%`}
                />
              ))}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
                {formatNights(stop.nights)}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="font-mono">{formatDateRange(stop.startDate, stop.nights)}</span>
            </span>
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            {stop.region}
            {stop.region && ' · '}
            {formatElevation(days[0].elevationM, units)} elev.
          </div>
        </div>
        <Badge
          variant={hasForecast ? 'default' : 'secondary'}
          className="self-start shrink-0 whitespace-nowrap"
        >
          {sourceLabel}
        </Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3.5">
        <div className="grid flex-1 grid-cols-3 gap-3.5">
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              Typical high
            </div>
            <div className="mt-0.5 font-mono text-2xl font-medium tracking-tight">
              {formatTemp(avgHigh, units)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              Typical low
            </div>
            <div className="mt-0.5 font-mono text-2xl font-medium tracking-tight text-muted-foreground">
              {formatTemp(avgLow, units)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              Precipitation chance
            </div>
            <div className="mt-0.5 font-mono text-2xl font-medium tracking-tight text-muted-foreground">
              {formatPercent(wetDayProbability)}
            </div>
          </div>
        </div>
        <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label="Edit stop" title="Edit stop">
          <Pencil />
        </Button>
      </div>
    </div>
  )
}

import { Pencil } from 'lucide-react'
import type { DayStats, Stop, Units } from '@/types'
import type { DayStatsState } from '@/store/trip-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConditionIconGroups } from '@/components/condition-icon'
import { StopEditor, type StopDraft } from '@/components/stop-editor'
import { isForecastGradeWetDay } from '@/condition'
import { formatElevation, formatPercent, formatPrecip, formatPrecipDelta, formatTemp, formatTempDelta } from '@/lib/units'
import { formatDateRange, formatNights } from '@/lib/dates'
import { mean } from '@/open-meteo'
import { maxOrNaN, minOrNaN, validNumbers } from '@/lib/utils'

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
  // Peaks across the stay (not means): the hottest night's high, the coldest
  // night's low. Rain chance stays a mean so one wet night doesn't dominate.
  const avgHigh = maxOrNaN(validNumbers(days.map((d) => d.avgHigh)))
  const avgLow = minOrNaN(validNumbers(days.map((d) => d.avgLow)))
  const wetDayProbability = mean(validNumbers(days.map((d) => d.wetDayProbability)))
  // A long stay can straddle the forecast/historical boundary (see
  // forecast.ts getDayStats) — show both badges when it does, instead of
  // only looking at the first night's source.
  const hasForecast = days.some((d) => d.source === 'forecast')
  const hasObserved = days.some((d) => d.source === 'observed')
  // Observed days still carry the 30-year normal in avg*/wetDayProbability,
  // so for labeling purposes they count as historical, not forecast.
  const hasHistorical = days.some((d) => d.source === 'historical') || hasObserved
  const observedDays = days.filter((d) => d.source === 'observed')
  // Extremes that occurred (hottest day, coldest night), not averages — an
  // average would read like the 30-year "Typical" figures shown above.
  const actualHigh = maxOrNaN(validNumbers(observedDays.map((d) => d.actualHigh ?? NaN)))
  const actualLow = minOrNaN(validNumbers(observedDays.map((d) => d.actualLow ?? NaN)))
  const actualRain = observedDays.reduce((sum, d) => sum + (Number.isFinite(d.actualPrecip) ? d.actualPrecip! : 0), 0)
  // Typical peaks over just the observed nights (like-for-like with the actual peaks), so the comparison isn't
  // diluted by forecast/historical nights elsewhere in the stay.
  const normalHigh = maxOrNaN(validNumbers(observedDays.map((d) => d.avgHigh)))
  const normalLow = minOrNaN(validNumbers(observedDays.map((d) => d.avgLow)))
  const normalRain = observedDays.reduce((sum, d) => sum + (Number.isFinite(d.precipMean) ? d.precipMean : 0), 0)
  // Only a pure-forecast stop's wet-day % is a real forecast-grade "chance" —
  // a historical-only or mixed stop's average is (partly) a 30-year
  // frequency, so label it as such instead of overclaiming precision.
  const isPureForecast = isForecastGradeWetDay(hasForecast, hasHistorical)
  // Full labels on wider screens; shorter ones on phones, where three
  // columns leave room for roughly two short lines each.
  const wetDayLabel = (
    <>
      <span className="sm:hidden">Avg wet chance</span>
      <span className="hidden sm:inline">{isPureForecast ? 'Avg precipitation chance' : 'Avg historically wet'}</span>
    </>
  )
  const highLabel = (
    <>
      <span className="sm:hidden">Highest high</span>
      <span className="hidden sm:inline">{isPureForecast ? 'Highest forecast high' : 'Highest typical high'}</span>
    </>
  )
  const lowLabel = (
    <>
      <span className="sm:hidden">Lowest low</span>
      <span className="hidden sm:inline">{isPureForecast ? 'Lowest forecast low' : 'Lowest typical low'}</span>
    </>
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">{stop.city}</span>
            <ConditionIconGroups days={days} />
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
        <div className="flex shrink-0 items-center gap-1.5 self-start">
          {hasObserved && (
            <Badge variant="default" className="whitespace-nowrap">
              Actual
            </Badge>
          )}
          {hasForecast && (
            <Badge variant="outline" className="whitespace-nowrap">
              Forecast
            </Badge>
          )}
          {days.some((d) => d.source === 'historical') && (
            <Badge variant="secondary" className="whitespace-nowrap">
              Historical
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3.5">
        <div className="grid flex-1 grid-cols-3 gap-3.5">
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              {highLabel}
            </div>
            <div className="mt-0.5 font-mono text-2xl font-medium tracking-tight">
              {formatTemp(avgHigh, units)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              {lowLabel}
            </div>
            <div className="mt-0.5 font-mono text-2xl font-medium tracking-tight text-muted-foreground">
              {formatTemp(avgLow, units)}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
              {wetDayLabel}
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

      {hasObserved && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="grid grid-cols-3 gap-3.5">
            {[
              { label: 'Highest', value: formatTemp(actualHigh, units), delta: formatTempDelta(actualHigh - normalHigh, units), vs: 'high' },
              { label: 'Lowest', value: formatTemp(actualLow, units), delta: formatTempDelta(actualLow - normalLow, units), vs: 'low' },
              { label: 'Rain total', value: formatPrecip(actualRain, units), delta: formatPrecipDelta(actualRain - normalRain, units), vs: '' },
            ].map(({ label, value, delta, vs }) => (
              <div key={label}>
                <div className="text-[10.5px] font-semibold tracking-wider text-primary uppercase">{label}</div>
                {/* Phones: value, then the difference on its own line. */}
                <div className="mt-0.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-1.5">
                  <span className="font-mono text-base font-medium">{value}</span>
                  <span className="font-mono text-[11px] text-muted-foreground sm:text-xs">
                    {delta} vs typical<span className="hidden sm:inline">{vs && ` ${vs}`}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {observedDays.length < days.length
              ? `Peaks and rain total so far · ${observedDays.length} of ${days.length} nights`
              : `Peaks and rain total · all ${days.length} ${days.length === 1 ? 'night' : 'nights'}`}
          </div>
        </div>
      )}
    </div>
  )
}

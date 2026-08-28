import { useCallback, useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayStats, Stop, Units } from '@/types'
import type { DayStatsState } from '@/store/trip-store'
import { CONDITION_ICON, ConditionIcon } from '@/components/condition-icon'
import { Badge } from '@/components/ui/badge'
import { classifyDay, CONDITION_LABEL, type Condition } from '@/condition'
import { formatPrecip, formatTemp } from '@/lib/units'

type ChartDatum = DayStats & {
  index: number
  stopName: string
  avgSpanBase: number
  avgSpan: number
  recordSpanBase: number
  recordSpan: number
}

type StopSpan = {
  stopId: string
  stopName: string
  dayCount: number
  startIndex: number
}

function buildChartData(stops: Stop[], dayStats: Record<string, DayStatsState>) {
  const points: ChartDatum[] = []
  const spans: StopSpan[] = []
  let index = 0

  for (const stop of stops) {
    const days = dayStats[stop.id]
    if (!Array.isArray(days) || days.length === 0) continue

    const startIndex = index
    for (const day of days) {
      points.push({
        ...day,
        index,
        stopName: stop.city,
        avgSpanBase: day.avgLow,
        avgSpan: day.avgHigh - day.avgLow,
        recordSpanBase: day.recordLow,
        recordSpan: day.recordHigh - day.recordLow,
      })
      index += 1
    }

    spans.push({
      stopId: stop.id,
      stopName: stop.city,
      dayCount: days.length,
      startIndex,
    })
  }

  return { points, spans, totalDays: index }
}

export function shouldShowTripRangeChart(stops: Stop[], dayStats: Record<string, DayStatsState>): boolean {
  return stops.filter((stop) => Array.isArray(dayStats[stop.id]) && dayStats[stop.id]!.length > 0).length >= 2
}

type ConditionGroup = {
  condition: Condition
  startIndex: number
  endIndex: number
}

// Collapses consecutive days that render the same icon into a single group,
// so the icon row shows one icon per visible weather change instead of one
// per day (or one per subtle intensity change, e.g. slight vs moderate rain,
// that wouldn't look any different anyway). Groups can span a stop boundary —
// this is a trip-wide overview, so a run of clear days that happens to
// straddle two stops still reads as one icon.
function buildConditionGroups(points: ChartDatum[]): ConditionGroup[] {
  const groups: ConditionGroup[] = []
  for (const point of points) {
    const condition = classifyDay(point)
    const icon = CONDITION_ICON[condition]
    const last = groups[groups.length - 1]
    if (last && CONDITION_ICON[last.condition] === icon && last.endIndex === point.index - 1) {
      last.endIndex = point.index
    } else {
      groups.push({ condition, startIndex: point.index, endIndex: point.index })
    }
  }
  return groups
}

// Recharts reserves this many px on the left for the y-axis tick labels, so
// the plotted line only spans the remaining width — any overlay positioned
// by raw percentage-of-container would drift left of the actual data.
const Y_AXIS_WIDTH = 34

// Converts a data index (0 to totalDays - 1) to a CSS `left` value that lines
// up with where ComposedChart's `type="number"` x-axis actually plots it:
// index 0 at the left edge of the plot area, the last index at the right edge.
function indexToLeft(index: number, totalDays: number): string {
  const frac = totalDays > 1 ? index / (totalDays - 1) : 0
  return `calc(${Y_AXIS_WIDTH}px + (100% - ${Y_AXIS_WIDTH}px) * ${frac})`
}

// Same positioning math as indexToLeft, but resolved to an actual pixel
// number (given a measured container width) so we can compare distances
// between icons instead of just placing them.
function indexToLeftPx(index: number, totalDays: number, width: number): number {
  const frac = totalDays > 1 ? index / (totalDays - 1) : 0
  return Y_AXIS_WIDTH + (width - Y_AXIS_WIDTH) * frac
}

// Icons are ~14px wide; require a bit more than that between centers so
// adjacent icons never visually touch, let alone overlap.
const ICON_MIN_GAP_PX = 22

// On long trips, many condition changes can pack more icon centers than fit
// without overlapping. Walk left to right and drop any icon that would land
// too close to the last one we kept — favors the change and its neighbors
// reading distinctly over showing every single change.
function thinConditionGroups(groups: ConditionGroup[], totalDays: number, width: number): ConditionGroup[] {
  if (width <= 0) return groups
  const kept: ConditionGroup[] = []
  let lastCenterPx = -Infinity
  for (const group of groups) {
    const centerPx = indexToLeftPx((group.startIndex + group.endIndex) / 2, totalDays, width)
    if (centerPx - lastCenterPx >= ICON_MIN_GAP_PX) {
      kept.push(group)
      lastCenterPx = centerPx
    }
  }
  return kept
}

// Rounds the visible temperature extremes out to the nearest 10 (e.g. a
// 15-35 range becomes a 10-40 axis) so the background scale reads in tidy
// increments instead of the exact data bounds.
function computeAxisBounds(points: ChartDatum[]): { min: number; max: number } {
  if (points.length === 0) return { min: 0, max: 10 }
  const min = Math.floor(Math.min(...points.map((p) => p.recordLow)) / 10) * 10
  const max = Math.ceil(Math.max(...points.map((p) => p.recordHigh)) / 10) * 10
  return { min, max: max > min ? max : min + 10 }
}

function ChartTooltip({
  active,
  payload,
  units,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartDatum }>
  units: Units
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0].payload
  const condition = classifyDay(datum)

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">{datum.stopName}</div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ConditionIcon condition={condition} />
              {CONDITION_LABEL[condition]}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{datum.date}</div>
        </div>
        <Badge variant={datum.source === 'forecast' ? 'default' : 'secondary'} className="shrink-0 text-[9px]">
          {datum.source === 'forecast' ? 'Forecast' : 'Historical'}
        </Badge>
      </div>
      <div className="mt-1.5 flex gap-3 font-mono text-xs">
        <span>
          {datum.source === 'historical' && <span className="text-muted-foreground">avg</span>}{' '}
          {formatTemp(datum.avgLow, units)}
          <span className="mx-0.5">·</span>
          {formatTemp(datum.avgHigh, units)}
        </span>
        <span>
          <span className="text-muted-foreground">{datum.source === 'forecast' ? 'norm' : 'range'}</span>{' '}
          {formatTemp(datum.recordLow, units)}
          <span className="mx-0.5">·</span>
          {formatTemp(datum.recordHigh, units)}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {Math.round(datum.wetDayProbability * 100)}% precipitation chance
        <span className="mx-1">·</span>
        {formatPrecip(datum.precipMean, units)} {datum.source === 'historical' ? 'avg' : 'total'}
      </div>
    </div>
  )
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

export function TripRangeChart({
  stops,
  dayStats,
  units,
}: {
  stops: Stop[]
  dayStats: Record<string, DayStatsState>
  units: Units
}) {
  const { points, spans, totalDays } = useMemo(() => buildChartData(stops, dayStats), [stops, dayStats])
  const axisBounds = useMemo(() => computeAxisBounds(points), [points])
  const axisTicks = useMemo(() => {
    const step = 10
    const count = Math.round((axisBounds.max - axisBounds.min) / step) + 1
    return Array.from({ length: count }, (_, i) => axisBounds.min + i * step)
  }, [axisBounds])
  const conditionGroups = useMemo(() => buildConditionGroups(points), [points])

  const [iconRowWidth, setIconRowWidth] = useState(0)
  // A plain useEffect(() => {...}, []) would only ever attach once, on this
  // component's first render — but that first render (before 2+ stops have
  // resolved) returns null, so the div doesn't exist yet and there'd be
  // nothing to observe. A callback ref re-attaches every time the node
  // itself changes, including the first time it actually mounts.
  const iconRowRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const observer = new ResizeObserver((entries) => setIconRowWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const visibleConditionGroups = useMemo(
    () => thinConditionGroups(conditionGroups, totalDays, iconRowWidth),
    [conditionGroups, totalDays, iconRowWidth],
  )

  if (spans.length < 2) return null

  return (
    <div className="mt-3.5 rounded-lg border border-border bg-card p-3">
      <div ref={iconRowRef} className="relative h-4">
        {visibleConditionGroups.map((group) => (
          <span
            key={group.startIndex}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: indexToLeft((group.startIndex + group.endIndex) / 2, totalDays) }}
          >
            <ConditionIcon condition={group.condition} className="size-3.5" />
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={132}>
        <ComposedChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal vertical={false} stroke="var(--border)" strokeDasharray="2 2" />
          <XAxis dataKey="index" type="number" domain={[0, points.length - 1]} hide />
          <YAxis
            domain={[axisBounds.min, axisBounds.max]}
            ticks={axisTicks}
            axisLine={false}
            tickLine={false}
            width={Y_AXIS_WIDTH}
            tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
            tickFormatter={(value: number) => formatTemp(value, units)}
          />
          <Tooltip
            content={<ChartTooltip units={units} />}
            cursor={{ stroke: 'var(--border)', strokeDasharray: '2 2' }}
          />
          <Area dataKey="recordSpanBase" stackId="record" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area
            dataKey="recordSpan"
            stackId="record"
            stroke="none"
            fill="var(--muted-foreground)"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Area dataKey="avgSpanBase" stackId="avg" stroke="none" fill="transparent" isAnimationActive={false} />
          <Area
            dataKey="avgSpan"
            stackId="avg"
            stroke="none"
            fill="var(--muted-foreground)"
            fillOpacity={0.28}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="relative h-4">
        {spans.map((span, i) => (
          <span
            key={span.stopId}
            className="absolute top-0 -translate-x-1/2 text-[10px] font-medium tabular-nums text-muted-foreground"
            style={{ left: indexToLeft(span.startIndex + (span.dayCount - 1) / 2, totalDays) }}
            title={span.stopName}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

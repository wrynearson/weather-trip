import { useMemo } from 'react'
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayStats, Stop, Units } from '@/types'
import type { DayStatsState } from '@/store/trip-store'
import { ConditionIcon } from '@/components/condition-icon'
import { classifyStopCondition, type Condition } from '@/condition'
import { formatTemp } from '@/lib/units'

type ChartDatum = DayStats & {
  index: number
  stopName: string
  avgSpanBase: number
  avgSpan: number
  recordSpanBase: number
  recordSpan: number
  avgMid: number
}

type StopSpan = {
  stopId: string
  stopName: string
  dayCount: number
  condition: Condition
}

function buildChartData(stops: Stop[], dayStats: Record<string, DayStatsState>) {
  const points: ChartDatum[] = []
  const spans: StopSpan[] = []
  let index = 0

  for (const stop of stops) {
    const days = dayStats[stop.id]
    if (!Array.isArray(days) || days.length === 0) continue

    for (const day of days) {
      points.push({
        ...day,
        index,
        stopName: stop.city,
        avgSpanBase: day.avgLow,
        avgSpan: day.avgHigh - day.avgLow,
        recordSpanBase: day.recordLow,
        recordSpan: day.recordHigh - day.recordLow,
        avgMid: (day.avgHigh + day.avgLow) / 2,
      })
      index += 1
    }

    spans.push({
      stopId: stop.id,
      stopName: stop.city,
      dayCount: days.length,
      condition: classifyStopCondition(days),
    })
  }

  return { points, spans }
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

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <div className="text-sm font-semibold">{datum.stopName}</div>
      <div className="text-xs text-muted-foreground">{datum.date}</div>
      <div className="mt-1.5 flex gap-3 font-mono text-xs">
        <span>
          <span className="text-muted-foreground">avg</span> {formatTemp(datum.avgLow, units)}–
          {formatTemp(datum.avgHigh, units)}
        </span>
        <span>
          <span className="text-muted-foreground">rec</span> {formatTemp(datum.recordLow, units)}–
          {formatTemp(datum.recordHigh, units)}
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {Math.round(datum.wetDayProbability * 100)}% rain chance
      </div>
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
  const { points, spans } = useMemo(() => buildChartData(stops, dayStats), [stops, dayStats])

  if (spans.length < 2) return null

  return (
    <div className="mt-3.5 rounded-lg border border-border bg-muted/40 p-3">
      <ResponsiveContainer width="100%" height={120}>
        <ComposedChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="index" type="number" domain={[0, points.length - 1]} hide />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
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
          <Line dataKey="avgMid" stroke="var(--muted-foreground)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-1.5 flex">
        {spans.map((span) => (
          <div
            key={span.stopId}
            className="flex min-w-0 flex-col items-center gap-0.5 overflow-hidden"
            style={{ flexGrow: span.dayCount, flexBasis: 0 }}
          >
            <ConditionIcon condition={span.condition} className="size-3.5" />
            <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
              {span.stopName}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-end gap-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        <span className="flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-sm bg-muted-foreground/30" /> absolute range
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-sm bg-muted-foreground/60" /> avg min/max
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-px w-2 bg-muted-foreground" /> avg
        </span>
      </div>
    </div>
  )
}

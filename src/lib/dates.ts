function parseISODate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatShort(date: Date, includeMonth: boolean): string {
  return date.toLocaleDateString('en-US', {
    month: includeMonth ? 'short' : undefined,
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateRange(startDate: string, nights: number): string {
  const start = parseISODate(startDate)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + Math.max(1, nights))

  const sameMonth = start.getUTCMonth() === end.getUTCMonth()
  return `${formatShort(start, true)} – ${formatShort(end, !sameMonth)}`
}

export function formatNights(nights: number): string {
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`
}

export function addDaysISO(date: string, days: number): string {
  const dt = parseISODate(date)
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

// Whole days from `from` to `to` (negative if `to` is earlier).
export function daysBetweenISO(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000)
}

// Days left unplanned between the end of `stop` and the start of `next`.
// formatDateRange treats a stop as ending start + max(1, nights), so match it.
export function gapDaysBetweenStops(
  stop: { startDate: string; nights: number },
  next: { startDate: string },
): number {
  return daysBetweenISO(addDaysISO(stop.startDate, Math.max(1, stop.nights)), next.startDate)
}

type GapAmount = { value: number; unit: 'day' | 'week' | 'month' | 'year' }

// One place for the unit thresholds so the long and short labels can't drift.
function gapAmount(days: number): GapAmount {
  if (days < 14) return { value: days, unit: 'day' }
  if (days < 60) return { value: Math.round(days / 7), unit: 'week' }
  if (days < 335) return { value: Math.round(days / 30), unit: 'month' }
  // Nearest half year, so 400 days reads "1 year" and 600 days "1.5 years".
  return { value: Math.round((days / 365) * 2) / 2, unit: 'year' }
}

export function formatGap(days: number): string {
  const { value, unit } = gapAmount(days)
  return `${value} ${unit}${value === 1 ? '' : 's'} between stops`
}

const SHORT_UNIT = { day: 'd', week: 'w', month: 'mo', year: 'y' } as const

// Compact form for tight spots, e.g. "3d", "6w", "4mo", "1.5y".
export function formatGapShort(days: number): string {
  const { value, unit } = gapAmount(days)
  return `${value}${SHORT_UNIT[unit]}`
}

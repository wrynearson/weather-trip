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

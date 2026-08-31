import { useEffect, useState } from 'react'
import { ChevronDown, Trash2 } from 'lucide-react'
import { useTripStore } from '@/store/trip-store'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { StopCard } from '@/components/stop-card'
import { StopEditor, type StopDraft } from '@/components/stop-editor'
import { fetchStopWeather } from '@/lib/fetch-stop-weather'
import { addDaysISO } from '@/lib/dates'
import { cn } from '@/lib/utils'

export function StopsList() {
  const { stops, dayStats, units, addStop, updateStop, removeStop, clearTrip } = useTripStore()
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  useEffect(() => {
    // Stagger initial fetches (e.g. on page load with several saved stops)
    // instead of firing them all at once, which is the likeliest way to
    // trip the weather API's rate limit.
    const timers = stops
      .filter((stop) => dayStats[stop.id] === undefined && stop.lat !== 0)
      .map((stop, i) => setTimeout(() => fetchStopWeather(stop), i * 200))

    return () => timers.forEach(clearTimeout)
    // Only re-check when the stop list itself changes shape; saves trigger
    // their own fetch directly instead of relying on this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  function handleSaveNew(draft: StopDraft) {
    const id = addStop()
    updateStop(id, draft)
    fetchStopWeather({ id, ...draft })
    setEditingId(null)
  }

  function handleSaveEdit(id: string, draft: StopDraft) {
    updateStop(id, draft)
    fetchStopWeather({ id, ...draft })
    setEditingId(null)
  }

  function handleDelete(id: string) {
    removeStop(id)
    if (editingId === id) setEditingId(null)
  }

  const lastStop = stops[stops.length - 1]
  const defaultStartDate = lastStop ? addDaysISO(lastStop.startDate, lastStop.nights) : ''

  if (stops.length === 0 && editingId !== 'new') {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-7 py-13 text-center">
        <div className="text-lg font-semibold tracking-tight">No stops yet</div>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Add a city and a date and you'll get typical highs, lows, and rain odds for that stop.
        </p>
        <Button className="mt-5" onClick={() => setEditingId('new')}>
          Add your first stop
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {stops.length > 0 && (
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold tracking-wide text-foreground uppercase shadow-sm hover:bg-muted/50"
        >
          <span>Trip stops</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground normal-case">
            {collapsed ? 'Show' : 'Hide'}
            <ChevronDown className={cn('size-3.5 transition-transform', collapsed && '-rotate-90')} />
          </span>
        </button>
      )}

      {!collapsed && (
        <>
          {stops.map((stop, i) => (
            <div key={stop.id} className="flex items-start gap-3">
              <div className="mt-4.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-card font-mono text-xs text-muted-foreground">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <StopCard
                  stop={stop}
                  dayStatsState={dayStats[stop.id]}
                  units={units}
                  isEditing={editingId === stop.id}
                  onEdit={() => setEditingId(stop.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(draft) => handleSaveEdit(stop.id, draft)}
                  onDelete={() => handleDelete(stop.id)}
                  onRetry={() => fetchStopWeather(stop)}
                />
              </div>
            </div>
          ))}

          {editingId === 'new' && (
            <div className="flex items-start gap-3">
              <div className="mt-4.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-card font-mono text-xs text-muted-foreground">
                {stops.length + 1}
              </div>
              <div className="min-w-0 flex-1">
                <StopEditor
                  heading="New stop"
                  initial={{ query: '', picked: null, startDate: defaultStartDate, nights: 1 }}
                  onCancel={() => setEditingId(null)}
                  onSave={handleSaveNew}
                />
              </div>
            </div>
          )}

          {editingId !== 'new' && (
            <div className="ml-9 mt-3 flex items-center gap-2">
              {/* Clear Trip */}
              <Popover open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 />
                  <span className="sr-only">Clear trip</span>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56">
                  <p className="text-sm">Clear this trip? This can&apos;t be undone.</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmClearOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        clearTrip()
                        setConfirmClearOpen(false)
                      }}
                    >
                      Clear trip
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => setEditingId('new')}
                className="rounded-xl border border-dashed border-border px-4.5 py-3.5 text-left text-sm font-medium text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                + Add stop
              </button>
            </div>
          )}
        </>
      )}

      {collapsed && (
        <div className="ml-9 rounded-lg border border-dashed border-border px-4 py-3.5 text-sm text-muted-foreground">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'} hidden — showing trip overview only.
        </div>
      )}
    </div>
  )
}

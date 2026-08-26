import { useState } from 'react'
import { searchLocations, type GeocodeResult } from '@/geocode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type StopDraft = {
  city: string
  region: string
  lat: number
  lon: number
  startDate: string
  nights: number
}

type StopEditorProps = {
  heading: string
  initial: {
    query: string
    picked: GeocodeResult | null
    startDate: string
    nights: number
  }
  onCancel: () => void
  onSave: (draft: StopDraft) => void
  onDelete?: () => void
}

export function StopEditor({ heading, initial, onCancel, onSave, onDelete }: StopEditorProps) {
  const [query, setQuery] = useState(initial.query)
  const [picked, setPicked] = useState<GeocodeResult | null>(initial.picked)
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [startDate, setStartDate] = useState(initial.startDate)
  const [nightsInput, setNightsInput] = useState(String(initial.nights))

  const nights = Math.max(1, Number(nightsInput) || 1)
  const canSave = picked !== null && startDate !== ''
  const hint = !picked ? 'Search for a city.' : !startDate ? 'Choose a date for this stop.' : ''

  function pickSuggestion(result: GeocodeResult) {
    setPicked(result)
    setQuery(result.name)
    setSuggestions([])
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    // Some mobile keyboards re-fire an input event right after a suggestion
    // is tapped (autocomplete/predictive text), with the same text that was
    // just programmatically set — don't drop the just-made pick for that.
    if (picked && value !== picked.name) {
      setPicked(null)
    }
    searchLocations(value).then(setSuggestions)
  }

  function handleQueryKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      pickSuggestion(suggestions[0])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  function handleSave() {
    if (!picked) return
    onSave({
      city: picked.name,
      region: picked.region,
      lat: picked.lat,
      lon: picked.lon,
      startDate,
      nights,
    })
  }

  return (
    <div className="rounded-xl border border-ring/40 bg-card p-4 shadow-md">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
          {heading}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="cursor-pointer border-0 bg-transparent text-xs text-destructive underline decoration-1 underline-offset-4 hover:text-destructive/80"
          >
            Delete stop
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="stop-location">Location</Label>
          <Input
            id="stop-location"
            placeholder="Search a city"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleQueryKeyDown}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-40 mt-1.5 max-h-58 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.lat},${s.lon},${i}`}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="flex w-full items-baseline gap-2 border-b border-border/60 px-3 py-2 text-left last:border-b-0 hover:bg-accent"
                >
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="stop-date">Date</Label>
          <Input
            id="stop-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="stop-nights">Nights here</Label>
          <Input
            id="stop-nights"
            type="number"
            min={1}
            value={nightsInput}
            onChange={(e) => setNightsInput(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{hint}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            Save stop
          </Button>
        </div>
      </div>
    </div>
  )
}

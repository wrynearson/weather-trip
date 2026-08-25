import { Info } from 'lucide-react'
import { useTripStore } from '@/store/trip-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function Header() {
  const { stops, units, setUnits, clearTrip } = useTripStore()

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-[780px] px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-medium">Trip Weather Planner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Live forecasts for stops within 15 days, 30-year historical averages beyond that
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* °C/°F Toggle */}
            <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
              <Button
                variant={units === 'C' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setUnits('C')}
                className="min-w-10"
              >
                °C
              </Button>
              <Button
                variant={units === 'F' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setUnits('F')}
                className="min-w-10"
              >
                °F
              </Button>
            </div>

            {/* Clear Trip Link */}
            {stops.length > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={clearTrip}
                className="text-destructive hover:text-destructive/80"
              >
                Clear trip
              </Button>
            )}

            {/* About Button */}
            <Dialog>
              <DialogTrigger>
                <Button variant="outline" size="icon-sm" className="rounded-full">
                  <Info />
                  <span className="sr-only">About</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>About these figures</DialogTitle>
                </DialogHeader>
                <DialogDescription
                  render={<div className="space-y-2.5" />}
                >
                  <p>
                    Figures are long-run historical averages for each stop's date range, not a
                    forecast. Typical high/low reflect the usual range for that time of year;
                    recent stops closer in time may blend in short-range forecast data.
                  </p>
                  <p>
                    Your trip is saved in this browser only — it isn't synced or shared anywhere
                    else.
                  </p>
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  )
}

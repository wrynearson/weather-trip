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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full sm:flex-1">
            <h1 className="font-heading text-2xl font-medium">Trip Weather Planner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Forecasted and historical weather averages
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
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>About</DialogTitle>
                </DialogHeader>
                <DialogDescription
                  render={<div className="space-y-2.5" />}
                >
                  <p>
                    Trip Weather Planner helps you see typical weather across every stop on a
                    multi-city trip at a glance, so you can pack and plan around what to expect.
                  </p>
                  <p>
                    Stops within 15 days use a live short-range forecast. Stops further out show
                    30-year historical averages for that date range instead, since forecasts
                    aren't reliable that far ahead — each stop's card is labeled with which one
                    it's showing.
                  </p>
                  <p>
                    Weather data comes from{' '}
                    <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
                      Open-Meteo
                    </a>{' '}
                    (forecast and 30-year historical archive); locations are looked up via{' '}
                    <a
                      href="https://nominatim.openstreetmap.org"
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenStreetMap Nominatim
                    </a>
                    .
                  </p>
                  <p>
                    Your trip is saved in this browser only.
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

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { TripSummaryCard } from '@/components/trip-summary-card'
import { StopsList } from '@/components/stops-list'
import { Button } from '@/components/ui/button'
import { decodeTripFromParam } from '@/lib/share-trip'
import { useTripStore } from '@/store/trip-store'
import type { Stop, Units } from '@/types'

type PendingTrip = { stops: Stop[]; units: Units }

function App() {
  const [pendingTrip, setPendingTrip] = useState<PendingTrip | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const param = url.searchParams.get('trip')
    if (!param) return

    // Strip the param immediately regardless of outcome, so a refresh never
    // re-triggers the banner and a malformed link doesn't linger in the URL.
    const decoded = decodeTripFromParam(param)
    url.searchParams.delete('trip')
    window.history.replaceState({}, '', url)

    if (decoded) setPendingTrip(decoded)
  }, [])

  function handleLoadSharedTrip() {
    if (!pendingTrip) return
    useTripStore.getState().loadTrip(pendingTrip.stops, pendingTrip.units)
    setPendingTrip(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[780px] px-4 py-8">
        {pendingTrip && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Load shared trip — {pendingTrip.stops.length} stop
              {pendingTrip.stops.length === 1 ? '' : 's'}? This replaces your current trip.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingTrip(null)}>
                Dismiss
              </Button>
              <Button size="sm" onClick={handleLoadSharedTrip}>
                Load shared trip
              </Button>
            </div>
          </div>
        )}
        <TripSummaryCard />
        <div className="mt-6">
          <StopsList />
        </div>
      </main>
    </div>
  )
}

export default App

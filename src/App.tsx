import { Header } from '@/components/header'
import { TripSummaryCard } from '@/components/trip-summary-card'
import { StopsList } from '@/components/stops-list'
import { VersionChip } from '@/components/version-chip'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[780px] px-4 py-8">
        <TripSummaryCard />
        <div className="mt-6">
          <StopsList />
        </div>
        <div className="mt-6 flex justify-end">
          <VersionChip />
        </div>
      </main>
    </div>
  )
}

export default App

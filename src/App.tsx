import { Header } from '@/components/header'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-[780px] px-4 py-8">
        {/* Trip Summary Card, range chart, and Trip Stops List land here (later tickets) */}
      </main>
    </div>
  )
}

export default App

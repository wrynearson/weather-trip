# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, and others) when working with code in this repository.

## Commands

```bash
pnpm install       # install deps
pnpm dev            # vite dev server
pnpm build           # tsc -b && vite build — type-checks, then bundles
pnpm lint            # oxlint
pnpm test            # vitest run (all tests)
pnpm preview         # serve the production build locally
```

Run a single test file or test name:

```bash
pnpm exec vitest run src/forecast.test.ts
pnpm exec vitest run -t "daysUntil"
```

`@/*` resolves to `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`).

## Architecture

Client-only React app, no backend. Zustand (`src/store/trip-store.ts`) holds trip state
(`stops`, `dayStats`, `units`) and persists `stops`/`units` to `localStorage` under
`weather-trip:v1`. Rehydration runs parsed data through `sanitizeStops` (via the persist
`merge`/`migrate` hooks) rather than trusting it — extend that validation if you add fields
to `Stop`.

**Forecast vs. historical split** (`src/forecast.ts`, `getDayStats`): each night of a stop is
routed independently based on `daysUntil(date)`:
- `0..FORECAST_THRESHOLD_DAYS` (currently 14) → Open-Meteo forecast API (`fetchForecastSeries`)
- everything else, including past dates → Open-Meteo's 1991-2020 archive, pooled ±3 calendar
  days across all years (`src/climatology.ts`)

`FORECAST_THRESHOLD_DAYS` is 14, not `FORECAST_DAYS - 1` (15), on purpose: Open-Meteo returns
every daily field as `null` for the last day of any `forecast_days` window (it never gets a
full 24h of hourly source data), and `forecast_days` caps at 16 with no buffer day available.
Don't "fix" this by raising the threshold back to 15 — that reintroduces the day showing "No
data". A long stay can straddle the boundary, so a single stop's `DayStats[]` can mix
`source: 'forecast'` and `source: 'historical'` days.

**Fetch versioning**: `fetchStopWeather` (`src/lib/fetch-stop-weather.ts`) calls
`beginFetch(id)`/`commitDayStats(id, version, state)` on the store rather than setting
`dayStats` directly. This exists because rapid edits/retries can leave two fetches for the
same stop in flight; `commitDayStats` silently drops a result if a newer fetch has since
started for that id. Keep using this pair for anything that writes `dayStats` — a direct
`set()` reintroduces the stale-overwrite race.

**Caching layers**: each of `forecast.ts`/`climatology.ts` keeps an in-memory
`Map<string, Promise<DailySeries>>` keyed by `cacheKey(lat, lon)` to dedupe concurrent
requests within a session. Underneath that, `fetchDailySeriesCached` (`src/open-meteo.ts`)
persists the raw API response to `localStorage` with a freshness window (3h for forecast, 30
days for the historical archive, since it's static reference data) and falls back to stale
cached data on a failed fetch rather than erroring. The forecast cache key is versioned
(`weather-trip:forecast:v2:...`) — bump it if the requested `daily` fields change shape.

**Condition mapping** (`src/condition.ts`): WMO weather codes → `Condition` → grouped into
"families" (e.g. all rain intensities collapse to one family) for the icon-ranking/grouping
logic used in stop cards and the trip chart, so overview UI doesn't show one icon per
intensity tier.

**Chart bundle splitting**: `recharts` is only imported by
`src/components/trip-range-chart-inner.tsx`, which `src/components/trip-range-chart.tsx`
loads via `React.lazy`. `shouldShowTripRangeChart`/`ChartLegend` stay in the outer file
because callers need them synchronously and they don't depend on recharts. Don't move
recharts imports (or new chart code) into the outer file — that pulls the ~350kB chart chunk
back into the main bundle.

**Geocoding** (`src/geocode.ts`): debounced, abortable Nominatim search — a call superseded
by a newer one never settles (resolves or rejects), so callers only ever handle the latest
call's result. A genuine fetch failure rejects; `stop-editor.tsx` surfaces that distinctly
from an empty result set.

Test env pins `TZ=UTC` (`vite.config.ts`) because `daysUntil` and friends key off the local
calendar day — don't remove that or date-boundary tests become machine-dependent.

`tickets/` holds markdown writeups of known issues found via code review, each mirrored as a
GitHub issue in this repo; check there before re-diagnosing something that looks like a known
gap.

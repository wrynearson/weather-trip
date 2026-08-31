---
severity: high
status: fixed
area: state
---

# Stale weather fetches can overwrite a newer edit's results (no request versioning)

## Location
`src/lib/fetch-stop-weather.ts`, called from `src/components/stops-list.tsx:35,41,100`
(`handleSaveNew`, `handleSaveEdit`, `onRetry`)

## Problem
`fetchStopWeather` sets `dayStats[id] = 'loading'`, awaits `getDayStats`, then unconditionally
writes whatever comes back to `dayStats[id]`. If a stop is edited twice in quick succession
(or edited then retried), two overlapping fetches are in flight for the same stop id with no
correlation between a fetch and the edit that triggered it. Network timing is not guaranteed
to preserve call order — the older request can resolve after the newer one — so the older,
stale weather data can silently overwrite the correct, newer result. There's no visible error;
the UI just ends up showing weather for the wrong location/dates.

This is the same root cause behind ticket 004 (trip summary showing stale data during edits).

## Suggested fix
Track a request version/token per stop id (e.g. a counter in the store, or an
`AbortController` per stop id) and drop the result of any fetch that isn't the latest one
for that id when it resolves.

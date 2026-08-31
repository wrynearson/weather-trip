---
severity: medium
status: fixed
area: state
---

# Persisted trip-store state is trusted without validation or a migration path

## Location
`src/store/trip-store.ts:28-80` (zustand `persist`, key `weather-trip:v1`)

## Problem
`persist` reads `localStorage['weather-trip:v1']` and hands the parsed JSON straight to the
store with no runtime validation and no `version`/`migrate` option. If the shape of `Stop`
ever changes, or a `Stop` gets corrupted (e.g. manually edited localStorage, a partial write,
a future schema change), the bad data is trusted as-is and can produce invalid
dates/coordinates/night counts that break rendering or send malformed requests to the
weather APIs, with no clear error pointing at "your saved trip data is bad."

## Suggested fix
Add zustand's `version` + `migrate` to `persist`, and validate the parsed `stops` array
before trusting it (e.g. drop/repair entries missing required fields) rather than assuming
its shape.

---
severity: medium
status: fixed
area: testing
---

# No automated test coverage or test tooling

## Location
Repo-wide — `package.json` has no test script and no test framework (`vitest`/`jest`) in
`devDependencies`.

## Problem
There are zero test files. The logic most worth covering is exactly the logic this review
found bugs in by hand: forecast/historical date-boundary selection (ticket 001), historical
pooling window math (`monthDayWindow` in `src/climatology.ts`), NaN handling for missing API
values, and unit conversion (`src/lib/units.ts`). Without tests, regressions in this logic
ship silently — as the bugs in this review already did.

## Suggested fix
Add `vitest`, wire a `test` script, and cover at minimum: `daysUntil`/forecast-historical
boundary selection in `forecast.ts` (including the fix from ticket 001), `monthDayWindow`
and `aggregateHistoricalDay` in `climatology.ts` (calendar wraparound, leap-day, sparse
samples), and `celsiusToDisplay`/`formatTemp`/`formatPrecip` in `lib/units.ts`.

Do this after tickets 001, 002, and 005 land, so the tests cover the corrected behavior
instead of locking in the current bugs.

---
severity: low
status: open
area: performance
---

# Production JS bundle is larger than necessary

## Location
Build output (`pnpm build`) — reported as a single ~733 kB minified chunk in the original
review. Not re-verified in this pass.

## Problem
Everything ships in one chunk. `recharts` (used only by `TripRangeChart`) is likely a
significant share of that weight and isn't needed until a trip has 2+ resolved stops
(`shouldShowTripRangeChart` in `src/components/trip-range-chart.tsx:61-67`), so it's paying
for chart code on every initial load even when nothing will render it yet.

## Suggested fix
Lazy-load `TripRangeChart` (`React.lazy`/dynamic `import()`) behind
`shouldShowTripRangeChart`, and re-run `pnpm build` to confirm the initial chunk shrinks.

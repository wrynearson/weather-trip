---
severity: medium
status: fixed
area: ui
---

# "Precipitation chance" label is misleading for historical data

## Location
`src/components/stop-card.tsx:167-173`, `src/components/trip-range-chart.tsx:200-204` (tooltip)

## Problem
Both places label `wetDayProbability` as "precipitation chance" regardless of `source`. For
a forecast day (`src/forecast.ts:92-97`) that's a real per-day probability from the API. For
a historical day (`src/climatology.ts:87-89`) it's actually
`(pooled days with >1mm rain) / (pooled days)` — a frequency across ~30 years of sampled
days near that calendar date, not a "chance" for any specific day. These are conceptually
different numbers being shown under the same label with no distinction, which can mislead a
user into reading a 30-year frequency as a forecast-grade probability.

## Suggested fix
Differentiate the label by `source`, e.g. "Precipitation chance" for forecast and
"Historically wet" / "Wet-day frequency" for historical, in both the stop card and the chart
tooltip.

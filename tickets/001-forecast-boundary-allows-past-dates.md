---
severity: high
status: fixed
area: forecast
---

# Forecast eligibility has no lower bound, so past dates are silently treated as "forecast"

## Location
`src/forecast.ts:54` (`getDayStats`)

## Problem
```ts
const forecastDates = dates.filter((date) => daysUntil(date) <= FORECAST_THRESHOLD_DAYS)
```
This only checks an upper bound. `daysUntil()` (`src/forecast.ts:135`) returns negative
numbers for past dates, and negative numbers are `<= 15`, so a stop dated in the past is
classified as "forecast" instead of "historical."

`getForecastDayStats` then calls `fetchForecastSeries`, whose response only covers
today..+15 days. `nearestIndex` (`src/forecast.ts:117`) has no exact match for a past date,
falls back to the nearest available day (today, index 0), and returns that data — labeled
`source: 'forecast'` — for the past date. The user sees today's forecast silently
mislabeled as the weather for a date that already happened, with no error or indication
anything's off.

Confirmed by reading `stop-editor.tsx`: the date `<input type="date">` has no `min`, so a
past date is a reachable state, not just a theoretical one.

(The upper bound is fine — `FORECAST_DAYS = 16` and `daysUntil(date) <= 15` both admit
offsets 0..15, so there's no off-by-one there.)

## Suggested fix
Bound `forecastDates` on both sides, e.g. `daysUntil(date) >= 0 && daysUntil(date) <= FORECAST_THRESHOLD_DAYS`,
and route negative-offset dates to `getHistoricalDayStats` alongside the existing
"further than 15 days out" case.

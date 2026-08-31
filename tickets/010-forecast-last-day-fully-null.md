---
severity: high
status: fixed
area: forecast
---

# Last day of the 16-day forecast window is entirely null, shown as "No data"

## Location
`src/forecast.ts:7` (`FORECAST_THRESHOLD_DAYS`), `src/forecast.ts:80-112` (`aggregateForecastDay`)

## Problem
Reported live: adding "City of London" with a stay that includes day 15 (e.g. today
2026-08-31, stop date 2026-09-15) shows "No data" / all dashes for that day in the chart
tooltip and stop card, despite it being a legitimate near-term date.

Confirmed against the real API (`forecast_days=16`, London coords): the **last** day of the
response (index 15) has `null` for `temperature_2m_max`, `temperature_2m_min`,
`precipitation_sum`, and `weathercode` — not just `precipitation_probability_max`, which is
the only field `aggregateForecastDay` already has a fallback for (see the comment at
`src/forecast.ts:88-91`). With every core field null, `aggregateForecastDay` returns
`avgHigh`/`avgLow`/`precipMean` as `NaN` and `weatherCode` as `NaN` (→ `classifyDay` falls
back to `'unknown'`, rendered as "No data"), while still labeling the day `source: 'forecast'`.

This is structural, not a fluke: Open-Meteo's daily aggregates need a full day of hourly
source data, and the last day of any request window doesn't have one yet. `forecast_days`
caps at 16 (verified: requesting 17 is rejected), so there's no buffer day available to
absorb this — index 15 will always be incomplete.

## Suggested fix
Lower `FORECAST_THRESHOLD_DAYS` from 15 to 14, so a date 15 days out is no longer requested
as "forecast" and instead falls to the historical path (valid for any calendar date). The
16-day series is still fetched (unchanged), it's just never read at its last index. Verified
against live data that index 14 has complete core fields (only `precipitation_probability_max`
can still be null there, which the existing fallback already handles).

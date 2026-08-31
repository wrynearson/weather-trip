---
severity: low
status: fixed
area: geocode
---

# Nominatim search failures are indistinguishable from "no results"

## Location
`src/geocode.ts:39-71`

## Problem
Any fetch failure (network error, non-2xx, rate limit) resolves to `[]`, same as a genuine
"no matches" search. The user sees an empty suggestion list either way, with no way to tell
a real outage/rate-limit apart from a bad query.

Note: the original review also flagged a missing `User-Agent` header, but browsers forbid
scripts from setting that header on `fetch` — it's not actionable client-side. Nominatim's
usage policy is satisfied via the `Referer` header the browser sends automatically for
deployed use; this isn't something to fix here.

## Suggested fix
Surface a distinct "search failed, try again" state in `StopEditor` when the fetch itself
fails (vs. a successful empty response), rather than collapsing both into an empty list.

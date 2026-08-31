---
severity: medium
status: fixed
area: state
---

# Trip summary aggregates whatever's cached in `dayStats`, including data from a prior edit

## Location
`src/components/trip-summary-card.tsx:13-16`

## Problem
`resolvedDayStats` is built from every `Array.isArray` entry in `dayStats`, keyed only by
stop id. Deleting a stop is handled correctly today (`removeStop` in `src/store/trip-store.ts:58-66`
prunes `dayStats[id]` too), so this isn't about removed stops. The real gap is the same race
as ticket 002: while a stop is being re-fetched after an edit, `dayStats[id]` briefly holds
the previous fetch's array until `setDayStats` flips it to `'loading'`, and if a stale
response wins the race described in 002, the trip summary (and trip range chart) will
silently include the wrong stop's weather in the trip-wide low/high and condition mix.

## Suggested fix
No separate fix needed beyond ticket 002 — once fetches are versioned so a stale response
can't overwrite `dayStats[id]`, this resolves itself. Land 002 first and confirm this no
longer reproduces (e.g. edit a stop's city right after adding it, before the first fetch
resolves) rather than adding a second, redundant guard here.

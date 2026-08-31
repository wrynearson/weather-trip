---
severity: low
status: open
area: accessibility
---

# Condition icon detail is only exposed via hover `title`

## Location
`src/components/condition-icon.tsx:57-72`, used with per-condition frequency text in
`src/components/stop-card.tsx:113-118` and `src/components/trip-summary-card.tsx:29-36`

## Problem
`ConditionIcon` puts its descriptive text (e.g. "Rain · 40%") only in a `title` attribute on
a `<span>`. `title` tooltips don't appear on touch devices and aren't reliably announced by
screen readers, so this information is effectively unavailable outside a mouse hover on
desktop.

## Suggested fix
Add an `aria-label` on the icon (or the wrapping span) so screen readers get it regardless of
hover, and consider showing the top condition's label as visible text at some breakpoint
instead of icon-only.

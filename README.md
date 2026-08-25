# Trip Weather Planner

Build a multi-stop trip, see historically-normal (or near-term forecast) weather for each stop
on its dates, and get a packing readout — powered by [Open-Meteo](https://open-meteo.com/).

## Stack

- Vite + React + TypeScript + pnpm
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/)
- Zustand for state (stops, per-stop stats, units) — localStorage only, no backend
- Data: Open-Meteo historical archive (30-yr normals) + forecast API (≤15 days out)

See open issues for the build breakdown; `design/` will hold the design brief and prototype
once added.

## Develop

```bash
pnpm install
pnpm dev
```

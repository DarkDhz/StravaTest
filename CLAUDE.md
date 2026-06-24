# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # TypeScript check + production build → dist/
npm run preview    # serve the production build locally
```

There are no tests or linter configured. TypeScript strict mode acts as the type gate — `tsc -b` runs as part of `build`. Always run `npx tsc --noEmit` to verify types after changes.

## Architecture

Static single-page app (Vite + React + TypeScript + Tailwind CSS v4) that visualises Strava data pulled from a local HomeAssistant instance. The built `dist/` is deployed to an Nginx server at `192.168.0.103:/var/www/html/`.

### Data flow

```
HomeAssistant REST API  ──►  homeassistant.ts  ──►  useDashboard hook  ──►  App  ──►  components
                              (mock fallback)         (60 s polling)
```

- **`src/services/homeassistant.ts`** — single source of truth for HA connectivity. `HA_CONFIG` reads `VITE_HA_URL` / `VITE_HA_TOKEN` from `.env`. `ENTITY_MAP` maps dashboard fields to HA sensor entity IDs — **first file to edit when wiring real sensors**. Returns `getMockData()` when no token is set.
- **`src/hooks/useDashboard.ts`** — wraps `fetchDashboardData()` with 60 s polling, exposes `{ data, loading, lastRefresh, refresh }`.
- **`src/types/index.ts`** — all shared interfaces. Key types: `Activity`, `Goals`, `BikeMaintenance`, `PerformanceSummary`, `DashboardData`, `WeeklyData`, `ChartBar`, `HAState`.

### Partially wired HA fields

| Field | Status |
|---|---|
| `lastActivity.*`, `goals.*.current`, distance totals | Wired to HA sensors |
| `maintenance.*`, `weeklyData`, `monthlyData`, `yearlyData`, `lastActivity.polyline` | Still using mock data |

When wiring a new field: add its entity ID to `ENTITY_MAP` and replace the `getMockData()` call in `fetchDashboardData()`.

### Chart data model

`DashboardData` carries three parallel bar-data arrays used by `KilometersChart`:

| Field | Shape | Labels |
|---|---|---|
| `weeklyData: WeeklyData[]` | 7 entries | Lun–Dom |
| `monthlyData: ChartBar[]` | 4 entries | S1–S4 (weeks of month) |
| `yearlyData: ChartBar[]` | 12 entries | Ene–Dic |

All three share the same optional metric fields: `elevation` (m), `speed` (km/h), `time` (hours). For km, `fetchDashboardData()` uses the HA-sourced `monthlyTotal`/`yearlyTotal` props; for all other metrics it computes from bar data via `periodTotal()`.

### KilometersChart

Two independent controls:
- **Metric dropdown** (left, replaces title): Kilómetros · Desnivel · Velocidad media · Tiempo activo
- **Period tabs** (right): Esta semana · Este mes · Este año

The `METRICS` constant defines per-metric color, dimColor, and unit. `getVal`, `fmtTooltip`, `fmtYAxis`, and `fmtStat` are pure helpers that switch on `Metric`. Y-axis ticks are computed dynamically (rounded to a nice magnitude) rather than hardcoded. Speed across a period is a simple average of non-zero values; all other metrics sum.

The SVG uses `viewBox="0 0 420 160"` with `preserveAspectRatio="none"`. Each bar group renders: dim ghost rect → coloured active rect → transparent hover target → tooltip (on hover). Streak (consecutive active days ending at last ride) is derived from `weeklyData` regardless of active tab/metric.

### User-configurable settings (localStorage)

| Key | Component | What it stores |
|---|---|---|
| `goal-targets` | `Goals` | weekly / monthly / yearly km targets |
| `maintenance-thresholds` | `BikeMaintenance` | max km per component before service |

Stored values take precedence over the props. Both components expose a gear-icon button that opens a config popup.

### Map implementation

`ActivityMap` lazy-imports Leaflet (`import('leaflet')`) and renders CartoDB Dark Matter tiles. `activity.polyline` is `[lat, lng][]`. A loading overlay hides until the tile layer fires its `load` event.

### CSS design tokens

Defined in `src/index.css` — prefer these over hardcoded hex values:

```css
--strava-orange: #FC4C02
--bg-primary:    #1a1a1a
--bg-card:       #242424
--border-color:  #333333
--text-secondary: #9ca3af
--green:         #22c55e
```

## Environment

Copy `.env.example` to `.env`:

```
VITE_HA_URL=http://<ha-ip>:8123
VITE_HA_TOKEN=<long-lived-access-token>
```

## Deployment

```bash
npm run build
scp -r dist/* root@192.168.0.103:/var/www/html/
```

Credentials are in `credenciales.md` (not committed).

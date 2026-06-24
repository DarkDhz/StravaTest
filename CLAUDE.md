# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # TypeScript check + production build → dist/
npm run preview    # serve the production build locally
```

There are no tests or linter configured. TypeScript strict mode acts as the type gate — `tsc -b` runs as part of `build`.

## Architecture

This is a **static single-page app** (Vite + React + TypeScript + Tailwind CSS v4) that visualises Strava data pulled from a local HomeAssistant instance. The built `dist/` is deployed to an Nginx server at `192.168.0.103:/var/www/html/`.

### Data flow

```
HomeAssistant REST API  ──►  homeassistant.ts  ──►  useDashboard hook  ──►  App  ──►  components
                              (mock fallback)         (60 s polling)
```

- **`src/services/homeassistant.ts`** — single source of truth for HA connectivity. `HA_CONFIG` reads `VITE_HA_URL` / `VITE_HA_TOKEN` from `.env`. `ENTITY_MAP` maps dashboard fields to HA sensor entity IDs — **this is the first file to edit when wiring up real sensors**. Returns `getMockData()` when no token is set.
- **`src/hooks/useDashboard.ts`** — wraps `fetchDashboardData()` with a polling interval (default 60 s) and exposes `{ data, loading, lastRefresh, refresh }`.
- **`src/types/index.ts`** — all shared interfaces (`Activity`, `Goals`, `BikeMaintenance`, `PerformanceSummary`, `DashboardData`, `HAState`).

### Partially wired HA fields

`fetchDashboardData()` currently falls back to `getMockData()` for fields without real sensors yet:

| Field | Status |
|---|---|
| `lastActivity.*`, `goals.*.current`, distance totals | Wired to HA sensors |
| `maintenance.*`, `weeklyData`, `lastActivity.polyline` | Still using mock data |

When wiring a new field: add its entity ID to `ENTITY_MAP` and replace the `getMockData()` call in `fetchDashboardData()`.

### User-configurable settings (localStorage)

Two components manage their own thresholds via `localStorage`, bypassing the hardcoded values in `homeassistant.ts`:

| Key | Component | What it stores |
|---|---|---|
| `goal-targets` | `Goals` | weekly / monthly / yearly km targets |
| `maintenance-thresholds` | `BikeMaintenance` | max km per component before service |

The stored values take precedence over `goals.*.target` / `maintenance.*.max` from the data props. Both components expose a gear-icon button that opens a config popup.

### Components (one per dashboard card)

| Component | Card |
|---|---|
| `Header` | Top bar — live clock, date, refresh button |
| `LastActivity` | Last activity stats (6 metrics) |
| `ActivityMap` | Leaflet map with Strava route polyline |
| `Goals` | Weekly / monthly / yearly km progress bars + config popup |
| `RecentActivities` | Last 4 activities list |
| `KilometersChart` | Custom SVG bar chart — week/month/year tabs |
| `BikeMaintenance` | Component wear progress bars + config popup |
| `PerformanceSummary` | Full-width bottom summary strip |

Layout is a 4-column CSS grid (rows: activity+map+goals → recent+chart+maintenance → summary). Below `sm` breakpoint it collapses to a single column.

### Chart implementation

`KilometersChart` uses **raw SVG** (not Recharts) with a fixed `viewBox="0 0 420 160"`. Each bar slot renders a dim ghost rect plus a coloured active rect on top. This was chosen over Recharts for React 19 compatibility and smaller bundle size.

### Map implementation

`ActivityMap` lazy-imports Leaflet (`import('leaflet')`) and renders CartoDB Dark Matter tiles. The `activity.polyline` field is `[lat, lng][]`. A loading overlay (`!tilesLoaded` state) hides until the tile layer fires its `load` event.

### CSS design tokens

Global CSS variables are defined in `src/index.css` — prefer these over hardcoded hex values:

```css
--strava-orange: #FC4C02
--bg-primary:    #1a1a1a
--bg-card:       #242424
--bg-card-hover: #2a2a2a
--border-color:  #333333
--text-secondary: #9ca3af
--green:         #22c55e
```

The `.progress-bar` / `.progress-bar-fill` utility classes are also defined there.

## Environment

Copy `.env.example` to `.env` and fill in:

```
VITE_HA_URL=http://<ha-ip>:8123
VITE_HA_TOKEN=<long-lived-access-token>
```

Default goal targets (weekly 100 km, monthly 400 km, yearly 5000 km) and maintenance thresholds are hardcoded in `homeassistant.ts` as fallback defaults; users override them via the in-app config popups (stored in `localStorage`).

## Deployment

```bash
npm run build
scp -r dist/* root@192.168.0.103:/var/www/html/
```

The LXC container runs Debian 12 + Nginx. Credentials are in `credenciales.md` (not committed to any shared repo).

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Vite SPA)
```bash
npm run dev        # Vite dev server at http://localhost:5173 (proxies /api → :3001)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build locally
npx tsc --noEmit   # type-check without building — run after every change
```

### Stats server (Node.js + SQLite)
```bash
npm run server:install   # install server/ dependencies (run once)
npm run server:dev       # tsx watch — hot-reloads server/src/ changes
npm run server:start     # production: node dist/index.js
```

Run both in parallel during development:
```bash
# Terminal 1            # Terminal 2
npm run server:dev      npm run dev
```

No tests or linter configured. TypeScript strict mode is the type gate for both sides.

## Architecture

Two-process system:

```
HomeAssistant REST API (192.168.0.91:8123)
       │
       ├── src/services/homeassistant.ts  ← live last-activity data + polyline
       │
       └── server/src/sync.ts  ──► strava-stats.db (SQLite, project root)
                │                        │
                │ (every 60s)            ▼
                │                  server/src/stats.ts
                │                        │
                └────────────────────────┘
                        fetched by GET /api/stats
                               │
                               ▼
                src/services/homeassistant.ts  ← merges HA + stats in parallel
                               │
                               ▼
                src/hooks/useDashboard.ts  (60s polling)
                               │
                               ▼
                        App → components
```

### Data responsibilities

| Data | Source |
|---|---|
| `lastActivity.*` (name, date, distance, speed, elevation, calories, heartrate, polyline) | HA sensors — `sensor.strava_javier_de_santiago_guillen_ride*` |
| `goals.weekly.current` | Derived: sum of `weeklyData[].km` from SQLite (HA has no weekly total sensor) |
| `goals.monthly/yearly.current` | Falls back to mock (HA has no monthly/yearly sensor; SQLite doesn't aggregate these yet) |
| `weeklyData`, `monthlyData`, `yearlyData` | SQLite — computed from stored activities |
| `recentActivities` | SQLite (falls back to mock) |
| `maintenance.*` | SQLite `maintenance` table |
| `summary` (totalTime, totalElevation, bestDistance, bestTime) | SQLite aggregates |

When no HA token and no stats server are reachable, `fetchDashboardData()` returns full mock data from `getMockData()`.

### Server (`server/`)

- **`server/src/db.ts`** — opens `strava-stats.db` via `node:sqlite` (Node.js 22+ built-in). Defines schema and runs migrations on startup.
- **`server/src/sync.ts`** — polls HA every `SYNC_INTERVAL_MS` (default 60 000ms). Detects new activities via `date_name_distance` dedup key. Inserts into `activities`, increments `km_since_reset` on all maintenance rows. **Note: the entity IDs in `sync.ts` are the old generic names (e.g. `sensor.strava_last_activity_name`) which no longer exist in this HA instance — they need updating to the `sensor.strava_javier_de_santiago_guillen_ride*` entities.**
- **`server/src/stats.ts`** — pure SQL queries: `getWeeklyData()` (current ISO week Mon–Sun), `getMonthlyData()` (S1–S4 by calendar week), `getYearlyData()` (Ene–Dic), `getRecentActivities()`, `getSummary()`, `getMaintenance()`. Also exports `resetMaintenance()` and `updateMaintenanceMax()`.
- **`server/src/index.ts`** — Express on `STATS_PORT` (default 3001). Routes: `GET /api/stats`, `POST /api/maintenance/:component/reset`, `PATCH /api/maintenance/:component`, `POST /api/sync`.

### SQLite schema (`strava-stats.db`)

```
activities  — id (PK), name, date (YYYY-MM-DD), distance (km), time_secs,
              elevation (m), speed (km/h), power (W), calories, type
maintenance — component (PK), km_since_reset, max_km, reset_at
```

`maintenance` components: `chain`, `tires`, `brakes`, `generalService`.

### Frontend (`src/`)

- **`src/services/homeassistant.ts`** — calls HA and `/api/stats` in parallel, merges results.
  - `ENTITY_MAP` maps dashboard fields to real HA entity IDs — all under the `sensor.strava_javier_de_santiago_guillen_ride*` prefix.
  - `decodePolyline(encoded)` converts the Google Encoded Polyline from the `ride` sensor's `polyline` attribute to `[lat, lng][]`.
  - `secsToHMS(n)` converts moving time from seconds (what HA returns) to `H:MM:SS` (what the UI expects).
  - HA power/cadence sensors return `"unknown"` when no power meter is present — `parseNum()` returns `0` for non-numeric states.
- **`src/hooks/useDashboard.ts`** — wraps `fetchDashboardData()` with 60s polling, exposes `{ data, loading, lastRefresh, refresh }`.
- **`src/types/index.ts`** — all shared interfaces: `Activity`, `Goals`, `BikeMaintenance`, `PerformanceSummary`, `DashboardData`, `WeeklyData`, `ChartBar`, `HAState`.

### Real HA entity IDs (Strava integration, device: Javier De Santiago Guillén Ride)

```
sensor.strava_javier_de_santiago_guillen_ride              ← name + polyline attribute
sensor.strava_javier_de_santiago_guillen_ride_date
sensor.strava_javier_de_santiago_guillen_ride_distance
sensor.strava_javier_de_santiago_guillen_ride_moving_time  ← state in seconds
sensor.strava_javier_de_santiago_guillen_ride_elevation_gain
sensor.strava_javier_de_santiago_guillen_ride_speed
sensor.strava_javier_de_santiago_guillen_ride_power        ← "unknown" when no power meter
sensor.strava_javier_de_santiago_guillen_ride_calories
sensor.strava_javier_de_santiago_guillen_ride_average_heartrate
sensor.strava_javier_de_santiago_guillen_carretera_distance  ← total km on road bike gear
sensor.strava_javier_de_santiago_guillen_mtb_distance        ← total km on MTB gear
```

### KilometersChart

SVG chart (`viewBox="0 0 420 160"`, `preserveAspectRatio="none"`). Two independent controls:
- **Metric dropdown** (left): Kilómetros · Desnivel · Velocidad media · Tiempo activo — defined in `METRICS` constant
- **Period tabs** (right): Esta semana · Este mes · Este año

Each bar group: dim ghost rect → coloured active rect → transparent hover target → tooltip. Y-axis ticks computed dynamically (nice magnitude). Speed is averaged over non-zero values; all other metrics sum. Streak derived from `weeklyData` regardless of active tab.

### Map

`ActivityMap` lazy-imports Leaflet and renders CartoDB Dark Matter tiles. `activity.polyline` is `[lat, lng][]`. The `ride` sensor's `polyline` attribute is a Google Encoded Polyline string — `decodePolyline()` in `homeassistant.ts` converts it. Loading overlay hides on tile layer `load` event.

### User-configurable settings (localStorage)

| Key | Component | What it stores |
|---|---|---|
| `goal-targets` | `Goals` | weekly / monthly / yearly km targets |
| `maintenance-thresholds` | `BikeMaintenance` | max km per component before service |

These take precedence over props (and over the SQLite `max_km` values for display). Both components expose a gear-icon popup.

### CSS design tokens

```css
--strava-orange: #FC4C02
--bg-primary:    #1a1a1a
--bg-card:       #242424
--border-color:  #333333
--text-secondary: #9ca3af
--green:         #22c55e
```

## Environment

`.env` (already created, not committed):

```
VITE_HA_URL=http://192.168.0.91:8123
VITE_HA_TOKEN=<long-lived-access-token>
STATS_PORT=3001
SYNC_INTERVAL_MS=60000
```

## Infrastructure

| Host | Role |
|---|---|
| `192.168.0.90` | Proxmox hypervisor (SSH root) |
| `192.168.0.91` | Home Assistant OS VM (VMID 100) |
| `192.168.0.92` | LXC: omada (VMID 101) |
| `192.168.0.93` | LXC: adguard (VMID 102) |
| `192.168.0.103` | LXC: strava-web / Nginx (VMID 103, Debian 12) |

Credentials are in `credenciales.md` (not committed).

## Deployment

The deploy target is the LXC container at `192.168.0.103` (Nginx serving `/var/www/html`). To redeploy use the Python paramiko scripts in the session scratchpad, or manually:

```bash
npm run build
# Then SCP or pct push via Proxmox:
# scp -r dist/* root@192.168.0.103:/var/www/html/
```

The stats server (`server/`) is not yet deployed to the LXC. When deploying it, add to Nginx:

```nginx
location /api/ {
    proxy_pass http://localhost:3001;
}
```

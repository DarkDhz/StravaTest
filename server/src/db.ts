import { DatabaseSync } from 'node:sqlite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const db = new DatabaseSync(resolve(root, 'strava-stats.db'))

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS activities (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL DEFAULT '',
    date        TEXT    NOT NULL,
    distance    REAL    NOT NULL DEFAULT 0,
    time_secs   INTEGER NOT NULL DEFAULT 0,
    elevation   REAL    NOT NULL DEFAULT 0,
    speed       REAL    NOT NULL DEFAULT 0,
    power       REAL    NOT NULL DEFAULT 0,
    calories    REAL    NOT NULL DEFAULT 0,
    type        TEXT    NOT NULL DEFAULT 'Ride',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS maintenance (
    component      TEXT  PRIMARY KEY,
    km_since_reset REAL  NOT NULL DEFAULT 0,
    max_km         REAL  NOT NULL DEFAULT 1500,
    reset_at       TEXT
  );

  INSERT OR IGNORE INTO maintenance (component, km_since_reset, max_km) VALUES ('chain',          0, 1500);
  INSERT OR IGNORE INTO maintenance (component, km_since_reset, max_km) VALUES ('tires',          0, 3000);
  INSERT OR IGNORE INTO maintenance (component, km_since_reset, max_km) VALUES ('brakes',         0, 1000);
  INSERT OR IGNORE INTO maintenance (component, km_since_reset, max_km) VALUES ('generalService', 0, 5000);
`)

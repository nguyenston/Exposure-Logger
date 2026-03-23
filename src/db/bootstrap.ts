import { sqlite } from '@/db/client';

const DATABASE_VERSION = 4;

const MIGRATION_1 = `
CREATE TABLE IF NOT EXISTS rolls (
  id TEXT PRIMARY KEY NOT NULL,
  nickname TEXT,
  camera TEXT NOT NULL,
  film_stock TEXT NOT NULL,
  native_iso INTEGER,
  shot_iso INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exposures (
  id TEXT PRIMARY KEY NOT NULL,
  roll_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  f_stop TEXT NOT NULL,
  shutter_speed TEXT NOT NULL,
  lens TEXT,
  latitude REAL,
  longitude REAL,
  location_accuracy REAL,
  captured_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (roll_id) REFERENCES rolls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gear_registry (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exposures_roll_id ON exposures(roll_id);
CREATE INDEX IF NOT EXISTS idx_exposures_roll_sequence ON exposures(roll_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_gear_registry_type_name ON gear_registry(type, name);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const MIGRATION_2 = `
ALTER TABLE rolls ADD COLUMN native_iso INTEGER;
ALTER TABLE rolls ADD COLUMN shot_iso INTEGER;
`;

const MIGRATION_3 = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const MIGRATION_4 = `
ALTER TABLE rolls ADD COLUMN nickname TEXT;
`;

let initialized = false;

export function initializeDatabase() {
  if (initialized) {
    return;
  }

  sqlite.execSync('PRAGMA foreign_keys = ON;');
  const version = sqlite.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = version?.user_version ?? 0;

  if (currentVersion < 1) {
    sqlite.withTransactionSync(() => {
      sqlite.execSync(MIGRATION_1);
      sqlite.execSync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  } else if (currentVersion < 2) {
    sqlite.withTransactionSync(() => {
      sqlite.execSync(MIGRATION_2);
      sqlite.execSync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  } else if (currentVersion < 3) {
    sqlite.withTransactionSync(() => {
      sqlite.execSync(MIGRATION_3);
      sqlite.execSync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  } else if (currentVersion < 4) {
    sqlite.withTransactionSync(() => {
      sqlite.execSync(MIGRATION_4);
      sqlite.execSync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }

  initialized = true;
}

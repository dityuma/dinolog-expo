import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'dinolog.db';
const DATABASE_VERSION = 2;

/**
 * Migrasi berbasis `PRAGMA user_version`. Tambahkan blok `if (currentDbVersion === n)`
 * baru untuk setiap perubahan skema, jangan mengubah blok lama.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = row?.user_version ?? 0;

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE pets (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        species       TEXT    NOT NULL DEFAULT '',
        gender        TEXT    NOT NULL DEFAULT 'unknown',
        birth_date    TEXT,
        adoption_date TEXT,
        photo_uri     TEXT,
        note          TEXT    NOT NULL DEFAULT '',
        created_at    INTEGER NOT NULL
      );

      CREATE TABLE growth_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        date       TEXT    NOT NULL,
        weight_g   REAL,
        length_cm  REAL,
        note       TEXT    NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE feeding_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        date       TEXT    NOT NULL,
        food_type  TEXT    NOT NULL DEFAULT '',
        amount     TEXT    NOT NULL DEFAULT '',
        frequency  TEXT    NOT NULL DEFAULT '',
        note       TEXT    NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE health_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        title      TEXT    NOT NULL DEFAULT '',
        start_date TEXT    NOT NULL,
        end_date   TEXT,
        ongoing    INTEGER NOT NULL DEFAULT 0,
        treatment  TEXT    NOT NULL DEFAULT '',
        note       TEXT    NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE shell_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        date       TEXT    NOT NULL,
        condition  TEXT    NOT NULL DEFAULT 'normal',
        severity   TEXT    NOT NULL DEFAULT 'ringan',
        note       TEXT    NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE brumation_logs (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id        INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        start_date    TEXT    NOT NULL,
        end_date      TEXT,
        weight_before REAL,
        weight_after  REAL,
        note          TEXT    NOT NULL DEFAULT '',
        created_at    INTEGER NOT NULL
      );

      CREATE TABLE photos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_type TEXT    NOT NULL,
        owner_id   INTEGER NOT NULL,
        uri        TEXT    NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX idx_growth_pet     ON growth_logs(pet_id, date DESC);
      CREATE INDEX idx_feeding_pet    ON feeding_logs(pet_id, date DESC);
      CREATE INDEX idx_health_pet     ON health_logs(pet_id, start_date DESC);
      CREATE INDEX idx_shell_pet      ON shell_logs(pet_id, date DESC);
      CREATE INDEX idx_brumation_pet  ON brumation_logs(pet_id, start_date DESC);
      CREATE INDEX idx_photos_owner   ON photos(owner_type, owner_id);
    `);
    currentDbVersion = 1;
  }

  if (currentDbVersion === 1) {
    await db.execAsync(`
      CREATE TABLE reminders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        pet_id          INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        title           TEXT    NOT NULL,
        kind            TEXT    NOT NULL DEFAULT 'lainnya',
        repeat_mode     TEXT    NOT NULL DEFAULT 'daily',
        weekday         INTEGER,
        day             INTEGER,
        date            TEXT,
        hour            INTEGER NOT NULL DEFAULT 8,
        minute          INTEGER NOT NULL DEFAULT 0,
        enabled         INTEGER NOT NULL DEFAULT 1,
        notification_id TEXT,
        created_at      INTEGER NOT NULL
      );

      CREATE INDEX idx_reminders_pet ON reminders(pet_id);
    `);
    currentDbVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

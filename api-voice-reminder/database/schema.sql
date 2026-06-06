-- =========================================
-- AI Voice Reminder - SQLite Schema
-- =========================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =========================================
-- REMINDERS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS reminders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT    NOT NULL,
  description     TEXT    DEFAULT '',
  date            TEXT    NOT NULL,
  time            TEXT    NOT NULL,
  repeat_mode     TEXT    DEFAULT 'none',
  repeat_interval INTEGER DEFAULT 0,
  repeat_unit     TEXT    DEFAULT NULL,
  category        TEXT    DEFAULT 'general',
  priority        TEXT    DEFAULT 'medium',
  voice_enabled   INTEGER DEFAULT 1,
  is_completed    INTEGER DEFAULT 0,
  is_snoozed      INTEGER DEFAULT 0,
  snooze_until    TEXT    DEFAULT NULL,
  completed_at    TEXT    DEFAULT NULL,
  created_at      TEXT    DEFAULT (datetime('now')),
  updated_at      TEXT    DEFAULT (datetime('now'))
);

-- =========================================
-- SETTINGS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('voice_name', 'default'),
  ('voice_volume', '0.9'),
  ('voice_rate', '1.0'),
  ('voice_pitch', '1.0'),
  ('notification_sound', 'chime'),
  ('notification_volume', '0.7'),
  ('auto_start', 'false'),
  ('language', 'en-US'),
  ('user_name', 'User'),
  ('minimize_to_tray', 'true'),
  ('scheduler_interval', '30');

-- =========================================
-- ANALYTICS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS analytics (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  date                 TEXT    NOT NULL UNIQUE,
  reminders_created    INTEGER DEFAULT 0,
  reminders_completed  INTEGER DEFAULT 0,
  reminders_missed     INTEGER DEFAULT 0,
  reminders_snoozed    INTEGER DEFAULT 0,
  productivity_score   REAL    DEFAULT 0,
  created_at           TEXT    DEFAULT (datetime('now'))
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX IF NOT EXISTS idx_reminders_date      ON reminders(date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);
CREATE INDEX IF NOT EXISTS idx_reminders_category  ON reminders(category);
CREATE INDEX IF NOT EXISTS idx_analytics_date      ON analytics(date);

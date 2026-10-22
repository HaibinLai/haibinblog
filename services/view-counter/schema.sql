PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS view_counts (
  path TEXT PRIMARY KEY NOT NULL,
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS view_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL CHECK (length(path) BETWEEN 1 AND 512),
  bucket INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL CHECK (length(visitor_hash) = 64),
  client_hash TEXT NOT NULL CHECK (length(client_hash) = 64),
  event_date TEXT NOT NULL DEFAULT '' CHECK (event_date = '' OR event_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (path, bucket, visitor_hash, client_hash)
) STRICT;

CREATE INDEX IF NOT EXISTS view_events_created_at_idx
  ON view_events (created_at);

CREATE INDEX IF NOT EXISTS view_events_event_date_idx
  ON view_events (event_date);

CREATE TRIGGER IF NOT EXISTS view_events_increment_counts
AFTER INSERT ON view_events
BEGIN
  INSERT INTO view_counts (path, total, updated_at)
  -- If seed.sql was accidentally skipped, preserve the absolute historical
  -- baseline and count this new event instead of starting the site at 1.
  VALUES ('@site', 363843, unixepoch())
  ON CONFLICT(path) DO UPDATE SET
    total = total + 1,
    updated_at = unixepoch();

  INSERT INTO view_counts (path, total, updated_at)
  VALUES (NEW.path, 1, unixepoch())
  ON CONFLICT(path) DO UPDATE SET
    total = total + 1,
    updated_at = unixepoch();
END;

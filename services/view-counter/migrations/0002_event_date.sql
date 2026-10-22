ALTER TABLE view_events ADD COLUMN event_date TEXT NOT NULL DEFAULT '';

-- Existing events were recorded during Chicago daylight time. UTC-5 therefore
-- reconstructs their local calendar date without ambiguity.
UPDATE view_events
SET event_date = strftime('%Y-%m-%d', created_at, 'unixepoch', '-5 hours')
WHERE event_date = '';

CREATE INDEX IF NOT EXISTS view_events_event_date_idx
  ON view_events (event_date);

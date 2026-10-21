-- Historical WordPress total at migration time. This is deliberately idempotent:
-- re-running the seed never resets a counter that has already advanced.
INSERT INTO view_counts (path, total, updated_at)
VALUES ('@site', 363842, unixepoch())
ON CONFLICT(path) DO NOTHING;

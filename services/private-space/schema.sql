PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS private_todos (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 180),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes) <= 4000),
  priority TEXT NOT NULL DEFAULT 'thisweek' CHECK(priority IN ('urgent', 'twodays', 'thisweek', 'anytime')),
  importance INTEGER NOT NULL DEFAULT 3 CHECK(importance BETWEEN 1 AND 5),
  due_date TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_todos_owner_updated
  ON private_todos(owner_email, updated_at DESC);

CREATE TABLE IF NOT EXISTS private_posts (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 240),
  excerpt TEXT NOT NULL DEFAULT '' CHECK(length(excerpt) <= 1000),
  content TEXT NOT NULL DEFAULT '' CHECK(length(content) <= 500000),
  tags TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(tags)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_posts_owner_updated
  ON private_posts(owner_email, pinned DESC, updated_at DESC);

ALTER TABLE private_todos ADD COLUMN deleted_at INTEGER;
ALTER TABLE private_posts ADD COLUMN deleted_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_private_todos_owner_deleted
  ON private_todos(owner_email, deleted_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_posts_owner_deleted
  ON private_posts(owner_email, deleted_at, updated_at DESC);

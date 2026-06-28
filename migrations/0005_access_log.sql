CREATE TABLE IF NOT EXISTS access_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  accessed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

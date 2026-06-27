ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN last_login_at TEXT;

ALTER TABLE feedback ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE feedback ADD COLUMN admin_reply TEXT;
ALTER TABLE feedback ADD COLUMN user_id INTEGER;

UPDATE users SET role = 'admin' WHERE nickname = '예재원';

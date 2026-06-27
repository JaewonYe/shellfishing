import { getDB } from '@/app/api/feedback/db';

interface SessionUser {
  id: number;
  nickname: string;
  role: string;
}

export async function getSessionUser(request: Request): Promise<{ user: SessionUser | null; db: any }> {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)session=([^\s;]+)/);
  const token = match?.[1];
  const db = getDB(request);

  if (!token || !db) {
    return { user: null, db };
  }

  const row = await db.prepare(
    `SELECT u.id, u.nickname, u.role
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).first();

  return { user: row ? { id: row.id as number, nickname: row.nickname as string, role: row.role as string } : null, db };
}

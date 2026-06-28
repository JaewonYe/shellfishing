import { NextResponse } from 'next/server';
import { getDB } from '@/app/api/feedback/db';

export const runtime = 'edge';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)session=([^\s;]+)/);
  const token = match?.[1];

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const db = getDB(request);
  if (!db) {
    return NextResponse.json({ user: null });
  }

  try {
    const row = await db.prepare(
      `SELECT u.id, u.nickname, u.profile_img, u.role, u.created_at
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(token).first();

    if (!row) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: row.id,
        nickname: row.nickname,
        profileImg: row.profile_img,
        role: row.role ?? 'user',
        createdAt: row.created_at,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getDB } from '@/app/api/feedback/db';
import { getSessionUser } from '@/app/api/auth/session';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { results } = await db
    .prepare('SELECT id, kakao_id, nickname, profile_img, role, login_count, last_login_at, created_at FROM users ORDER BY created_at DESC')
    .all();

  return NextResponse.json({ users: results ?? [] });
}

export async function PATCH(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.userId || !body.role) {
    return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
  }

  const validRoles = ['user', 'admin'];
  if (!validRoles.includes(body.role)) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(body.role, body.userId).run();
  return NextResponse.json({ ok: true });
}

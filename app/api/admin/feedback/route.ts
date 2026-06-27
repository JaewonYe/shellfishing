import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/api/auth/session';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { results } = await db
    .prepare('SELECT id, category, content, status, admin_reply, user_id, created_at FROM feedback ORDER BY created_at DESC')
    .all();

  return NextResponse.json({ items: results ?? [] });
}

export async function PATCH(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  if (body.status) {
    const validStatuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    await db.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(body.status, body.id).run();
  }

  if (typeof body.admin_reply === 'string') {
    await db.prepare('UPDATE feedback SET admin_reply = ? WHERE id = ?').bind(body.admin_reply.trim().slice(0, 2000), body.id).run();
  }

  return NextResponse.json({ ok: true });
}

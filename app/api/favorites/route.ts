import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/api/auth/session';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || !db) {
    return NextResponse.json({ favorites: [] }, { status: user ? 500 : 401 });
  }

  const { results } = await db.prepare(
    'SELECT id, label, lat, lng, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return NextResponse.json({ favorites: results ?? [] });
}

export async function POST(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || !db) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 50) : '';

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !label) {
    return NextResponse.json({ error: 'invalid-input' }, { status: 400 });
  }

  const countRow = await db.prepare('SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?').bind(user.id).first();
  if ((countRow?.cnt ?? 0) >= 30) {
    return NextResponse.json({ error: 'limit-exceeded' }, { status: 400 });
  }

  const result = await db.prepare(
    'INSERT INTO favorites (user_id, label, lat, lng) VALUES (?, ?, ?, ?)'
  ).bind(user.id, label, lat, lng).run();

  return NextResponse.json({ id: result.meta?.last_row_id ?? null });
}

export async function DELETE(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || !db) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'invalid-input' }, { status: 400 });
  }

  await db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return NextResponse.json({ ok: true });
}

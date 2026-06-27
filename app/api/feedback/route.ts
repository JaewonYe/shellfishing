import { NextResponse } from 'next/server';
import { getDB } from './db';
import { getSessionUser } from '@/app/api/auth/session';

export const runtime = 'edge';

const VALID_CATEGORIES = ['bug', 'feature', 'data', 'other'];

async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request) {
  const db = getDB(request);
  if (!db) {
    return NextResponse.json({ items: [], source: 'no-db' });
  }

  const { user } = await getSessionUser(request);

  const { results } = await db
    .prepare('SELECT id, category, content, status, admin_reply, user_id, created_at FROM feedback ORDER BY created_at DESC LIMIT 100')
    .all();

  const items = (results ?? []).map((r: any) => ({
    id: r.id,
    category: r.category,
    content: r.content,
    status: r.status,
    admin_reply: r.admin_reply,
    is_mine: user ? r.user_id === user.id : false,
    is_anonymous: !r.user_id,
    created_at: r.created_at,
  }));

  return NextResponse.json({ items, userId: user?.id ?? null });
}

export async function POST(request: Request) {
  const db = getDB(request);
  if (!db) {
    return NextResponse.json({ error: 'DB not available' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.content !== 'string' || !body.content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const { user } = await getSessionUser(request);

  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'feature';
  const content = body.content.trim().slice(0, 2000);

  if (user) {
    const result = await db
      .prepare('INSERT INTO feedback (category, content, user_id) VALUES (?, ?, ?)')
      .bind(category, content, user.id)
      .run();

    return NextResponse.json({
      id: result.meta.last_row_id,
      category,
      content,
      is_mine: true,
      is_anonymous: false,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 4) {
    return NextResponse.json({ error: 'password is required (min 4 chars)' }, { status: 400 });
  }

  const pwHash = await hashPassword(body.password);
  const result = await db
    .prepare('INSERT INTO feedback (category, content, password_hash) VALUES (?, ?, ?)')
    .bind(category, content, pwHash)
    .run();

  return NextResponse.json({
    id: result.meta.last_row_id,
    category,
    content,
    is_mine: false,
    is_anonymous: true,
    created_at: new Date().toISOString(),
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const db = getDB(request);
  if (!db) {
    return NextResponse.json({ error: 'DB not available' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { user } = await getSessionUser(request);

  const row = await db.prepare('SELECT user_id, password_hash FROM feedback WHERE id = ?').bind(Number(id)).first();
  if (!row) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Admin can delete anything
  if (user?.role === 'admin') {
    await db.prepare('DELETE FROM feedback WHERE id = ?').bind(Number(id)).run();
    return NextResponse.json({ ok: true });
  }

  // Logged-in user can delete own posts
  if (row.user_id && user && row.user_id === user.id) {
    await db.prepare('DELETE FROM feedback WHERE id = ?').bind(Number(id)).run();
    return NextResponse.json({ ok: true });
  }

  // Anonymous posts require password
  if (row.password_hash) {
    const password = searchParams.get('password');
    if (!password) {
      return NextResponse.json({ error: 'password required' }, { status: 403 });
    }
    const pwHash = await hashPassword(password);
    if (pwHash !== row.password_hash) {
      return NextResponse.json({ error: 'wrong password' }, { status: 403 });
    }
    await db.prepare('DELETE FROM feedback WHERE id = ?').bind(Number(id)).run();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}

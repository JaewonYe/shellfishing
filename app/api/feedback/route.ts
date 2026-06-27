import { NextResponse } from 'next/server';
import { getDB } from './db';

export const runtime = 'edge';

const VALID_CATEGORIES = ['bug', 'feature', 'data', 'other'];

export async function GET(request: Request) {
  const db = getDB(request);
  if (!db) {
    return NextResponse.json({ items: [], source: 'no-db' });
  }

  const { results } = await db
    .prepare('SELECT id, category, content, status, admin_reply, created_at FROM feedback ORDER BY created_at DESC LIMIT 100')
    .all();

  return NextResponse.json({ items: results ?? [] });
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

  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'feature';
  const content = body.content.trim().slice(0, 2000);

  const result = await db
    .prepare('INSERT INTO feedback (category, content) VALUES (?, ?)')
    .bind(category, content)
    .run();

  return NextResponse.json({
    id: result.meta.last_row_id,
    category,
    content,
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

  await db.prepare('DELETE FROM feedback WHERE id = ?').bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}

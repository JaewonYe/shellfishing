import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/api/auth/session';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { user, db } = await getSessionUser(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Number(searchParams.get('days') ?? 30), 90);

  const { results } = await db
    .prepare(
      `SELECT date(accessed_at) as date, COUNT(*) as count
       FROM access_log
       WHERE accessed_at >= datetime('now', ? || ' days')
       GROUP BY date(accessed_at)
       ORDER BY date DESC`
    )
    .bind(-days)
    .all();

  const totalUsers = await db
    .prepare('SELECT COUNT(*) as count FROM users')
    .first();

  return NextResponse.json({
    daily: results ?? [],
    totalUsers: totalUsers?.count ?? 0,
  });
}

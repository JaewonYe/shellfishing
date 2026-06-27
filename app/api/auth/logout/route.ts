import { NextResponse } from 'next/server';
import { getDB } from '@/app/api/feedback/db';

export const runtime = 'edge';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)session=([^\s;]+)/);
  const token = match?.[1];

  if (token) {
    const db = getDB(request);
    if (db) {
      await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

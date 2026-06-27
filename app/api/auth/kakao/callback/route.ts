import { NextResponse } from 'next/server';
import { getDB } from '@/app/api/feedback/db';

const KAKAO_CLIENT_ID = 'fd751f4e665363325e9e14672eb38625';
const REDIRECT_URI = 'https://www.gongyuhae.com/api/auth/kakao/callback';

export const runtime = 'edge';

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=code&reason=${error ?? 'no-code'}`);
  }

  let tokenData: any;
  try {
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET ?? '',
      }),
    });
    tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=token&reason=${tokenData.error ?? 'no-token'}`);
    }
  } catch (e: any) {
    return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=token&reason=${e.message}`);
  }

  let userData: any;
  try {
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=userinfo&reason=status-${userRes.status}`);
    }
    userData = await userRes.json();
  } catch (e: any) {
    return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=userinfo&reason=${e.message}`);
  }

  const kakaoId = String(userData.id);
  const nickname = userData.kakao_account?.profile?.nickname ?? '';
  const profileImg = userData.kakao_account?.profile?.profile_image_url ?? '';

  const db = getDB(request);
  if (!db) {
    return NextResponse.redirect('https://www.gongyuhae.com/?auth=failed&step=db&reason=no-db');
  }

  try {
    await db.prepare(
      `INSERT INTO users (kakao_id, nickname, profile_img)
       VALUES (?, ?, ?)
       ON CONFLICT(kakao_id) DO UPDATE SET nickname=excluded.nickname, profile_img=excluded.profile_img, updated_at=datetime('now')`
    ).bind(kakaoId, nickname, profileImg).run();

    const user = await db.prepare('SELECT id FROM users WHERE kakao_id = ?').bind(kakaoId).first();
    if (!user) {
      return NextResponse.redirect('https://www.gongyuhae.com/?auth=failed&step=db&reason=user-not-found');
    }

    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionToken, user.id, expiresAt).run();

    const response = NextResponse.redirect('https://www.gongyuhae.com/?auth=success');
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (e: any) {
    return NextResponse.redirect(`https://www.gongyuhae.com/?auth=failed&step=db&reason=${encodeURIComponent(e.message)}`);
  }
}

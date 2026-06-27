import { NextResponse } from 'next/server';

const KAKAO_CLIENT_ID = 'fd751f4e665363325e9e14672eb38625';
const REDIRECT_URI = 'https://www.gongyuhae.com/api/auth/kakao/callback';

export const runtime = 'edge';

export async function GET() {
  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', KAKAO_CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');

  return NextResponse.redirect(url.toString());
}

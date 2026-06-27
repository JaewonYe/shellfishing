import { NextResponse } from 'next/server';

export const runtime = 'edge';

const API_KEY = process.env.ITS_CCTV_API_KEY ?? '';
const ITS_URL = 'https://openapi.its.go.kr:9443/cctvInfo';

export async function GET(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const minX = searchParams.get('minX');
  const maxX = searchParams.get('maxX');
  const minY = searchParams.get('minY');
  const maxY = searchParams.get('maxY');

  if (!minX || !maxX || !minY || !maxY) {
    return NextResponse.json({ error: 'bounding box required' }, { status: 400 });
  }

  const url = new URL(ITS_URL);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('type', 'all');
  url.searchParams.set('cctvType', '1');
  url.searchParams.set('minX', minX);
  url.searchParams.set('maxX', maxX);
  url.searchParams.set('minY', minY);
  url.searchParams.set('maxY', maxY);
  url.searchParams.set('kind', '1');
  url.searchParams.set('getType', 'json');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'ITS API error', status: res.status }, { status: 502 });
    }

    const data = await res.json();
    const items = (data.response?.data ?? []).map((item: any) => ({
      name: item.cctvname,
      url: item.cctvurl,
      lat: parseFloat(item.coordy),
      lng: parseFloat(item.coordx),
      kind: item.cctvtype,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

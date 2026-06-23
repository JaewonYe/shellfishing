import { NextResponse } from 'next/server';
import fallbackStations from '@/public/tide-stations.json';

export const runtime = 'edge';

interface KhoaStation {
  obsPostId: string;
  obsPostName: string;
  obsLat: number;
  obsLon: number;
  useYn: string;
}

function getSea(lat: number, lng: number): string {
  if (lat < 34.2 && lng >= 125.5 && lng <= 128.0) return '제주';
  if (lat > 35.2 && lng > 128.5) return '동해';
  if (lng < 126.8 && lat >= 34.5) return '서해';
  return '남해';
}

export async function GET() {
  try {
    const res = await fetch('https://www.khoa.go.kr/swtc/gisDataList.do', {
      headers: { Referer: 'https://www.khoa.go.kr/swtc/main.do' },
    });

    if (!res.ok) throw new Error(`KHOA API ${res.status}`);

    const json = await res.json();
    const stations = (json.data as KhoaStation[])
      .filter(s => s.useYn === 'Y')
      .map(s => ({
        code: s.obsPostId,
        name: s.obsPostName,
        lat: s.obsLat,
        lng: s.obsLon,
        sea: getSea(s.obsLat, s.obsLon),
      }));

    return NextResponse.json(stations);
  } catch {
    return NextResponse.json(fallbackStations);
  }
}

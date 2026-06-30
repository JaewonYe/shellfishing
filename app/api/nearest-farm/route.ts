import { NextResponse } from 'next/server';

export const runtime = 'edge';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function centroid(feature: any): { lat: number; lng: number } | null {
  const p = feature.properties;
  if (typeof p?.lat === 'number' && typeof p?.lng === 'number') return { lat: p.lat, lng: p.lng };
  try {
    const coords: number[][] = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0];
    const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
    const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ farm: null }, { status: 400 });
  }

  try {
    const res = await fetch(new URL('/fishfarms.geojson', url.origin));
    if (!res.ok) return NextResponse.json({ farm: null });
    const json: any = await res.json();
    const features: any[] = json.features ?? [];

    let best: { dist: number; feature: any } | null = null;
    for (const feature of features) {
      const c = centroid(feature);
      if (!c) continue;
      const dist = haversineKm(lat, lng, c.lat, c.lng);
      if (!best || dist < best.dist) best = { dist, feature };
    }

    if (!best) return NextResponse.json({ farm: null });

    const p = best.feature.properties;
    return NextResponse.json({
      farm: {
        name: p.name ?? '-',
        sgg: p.sgg ?? '-',
        address: p.address ?? '-',
        species: p.species ?? '-',
        distKm: Math.round(best.dist * 10) / 10,
      },
    });
  } catch {
    return NextResponse.json({ farm: null }, { status: 500 });
  }
}

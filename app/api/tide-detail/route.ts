import { NextResponse } from 'next/server';
import allStations from '@/public/tide-stations.json';

export const runtime = 'edge';

interface TideStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  sea: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseLvl(lvl: string) {
  if (!lvl || lvl.startsWith('--')) return null;
  const p = lvl.split('/');
  if (p.length < 4) return null;
  const height = parseInt(p[3]);
  if (isNaN(height)) return null;
  return { time: p[0].trim(), type: p[1] as 'high' | 'low', height };
}

async function fetchWeekly(code: string, date: string) {
  const res = await fetch('https://www.khoa.go.kr/swtc/getWeeklyData.do', {
    method: 'POST',
    headers: {
      Referer: 'https://www.khoa.go.kr/swtc/main.do',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: `stDate=${date}&obsPostId=${code}`,
  });
  const json = await res.json();
  return (json.weeklyData ?? []).map((d: any) => ({
    date: d.searchDate as string,
    lunarDate: (d.dateMoon as string) ?? '',
    tideName: (d.moolNormal as string) ?? '',
    moonState: (d.moonState as string) ?? '',
    extrema: [d.lvl1, d.lvl2, d.lvl3, d.lvl4].map(parseLvl).filter(Boolean),
  }));
}

function hasData(weekly: { extrema: unknown[] }[]): boolean {
  return weekly.some(d => d.extrema.length > 0);
}

// ── WMO 날씨 코드 ──────────────────────────────────
function wmoIcon(code: number): string {
  if (code === 0)  return '☀️';
  if (code <= 1)   return '🌤️';
  if (code <= 2)   return '⛅';
  if (code <= 3)   return '☁️';
  if (code <= 48)  return '🌫️';
  if (code <= 55)  return '🌦️';
  if (code <= 65)  return '🌧️';
  if (code <= 77)  return '❄️';
  if (code <= 82)  return '🌧️';
  if (code <= 86)  return '🌨️';
  return '⛈️';
}

function wmoLabel(code: number): string {
  if (code === 0)  return '맑음';
  if (code <= 1)   return '대체로 맑음';
  if (code <= 2)   return '구름 조금';
  if (code <= 3)   return '흐림';
  if (code <= 48)  return '안개';
  if (code <= 55)  return '이슬비';
  if (code <= 65)  return '비';
  if (code <= 77)  return '눈';
  if (code <= 82)  return '소나기';
  if (code <= 86)  return '눈소나기';
  return '뇌우';
}

// 3시간 단위 슬롯
export interface WeatherSlot {
  hour:         number;        // 0, 3, 6, 9, 12, 15, 18, 21
  airTemp:      number | null; // °C
  windSpeed:    number | null; // km/h
  windDir:      number | null; // degrees
  weatherCode:  number | null;
  weatherIcon:  string;
  weatherLabel: string;
  waveHeight:   number | null; // m (유의파고)
  wavePeriod:   number | null; // s
  seaTemp:      number | null; // °C
}

const SLOT_HOURS = [0, 3, 6, 9, 12, 15, 18, 21] as const;

async function fetchMarineWeather(
  lat: number,
  lng: number,
  startDateStr: string, // "YYYYMMDD"
): Promise<WeatherSlot[][] | null> {
  const y  = parseInt(startDateStr.slice(0, 4));
  const mo = parseInt(startDateStr.slice(4, 6)) - 1;
  const d  = parseInt(startDateStr.slice(6, 8));

  // "YYYYMMDD" → "YYYY-MM-DD"
  const startDate = `${startDateStr.slice(0, 4)}-${startDateStr.slice(4, 6)}-${startDateStr.slice(6, 8)}`;
  const endDate   = new Date(Date.UTC(y, mo, d + 6)).toISOString().slice(0, 10);

  try {
    const [marineRes, weatherRes] = await Promise.all([
      fetch(
        `https://marine-api.open-meteo.com/v1/marine` +
        `?latitude=${lat}&longitude=${lng}` +
        `&hourly=wave_height,wave_period,sea_surface_temperature` +
        `&timezone=Asia%2FSeoul&start_date=${startDate}&end_date=${endDate}`,
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lng}` +
        `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
        `&wind_speed_unit=kmh&timezone=Asia%2FSeoul&start_date=${startDate}&end_date=${endDate}`,
      ),
    ]);

    if (!marineRes.ok || !weatherRes.ok) {
      console.error(`[tide-detail] Open-Meteo error: marine=${marineRes.status} weather=${weatherRes.status}`);
      return null;
    }

    const [marine, weather] = await Promise.all([marineRes.json(), weatherRes.json()]);

    if (marine.error || weather.error) {
      console.error(`[tide-detail] Open-Meteo body error: ${marine.reason ?? weather.reason}`);
      return null;
    }

    // 시각별 인덱싱 (Open-Meteo 형식: "YYYY-MM-DDTHH:00")
    const mByT: Record<string, { wh: number | null; wp: number | null; st: number | null }> = {};
    (marine.hourly?.time ?? []).forEach((t: string, i: number) => {
      mByT[t] = {
        wh: marine.hourly.wave_height?.[i]             ?? null,
        wp: marine.hourly.wave_period?.[i]             ?? null,
        st: marine.hourly.sea_surface_temperature?.[i] ?? null,
      };
    });

    const wByT: Record<string, { at: number | null; ws: number | null; wd: number | null; wc: number | null }> = {};
    (weather.hourly?.time ?? []).forEach((t: string, i: number) => {
      wByT[t] = {
        at: weather.hourly.temperature_2m?.[i]     ?? null,
        ws: weather.hourly.wind_speed_10m?.[i]     ?? null,
        wd: weather.hourly.wind_direction_10m?.[i] ?? null,
        wc: weather.hourly.weather_code?.[i]       ?? null,
      };
    });

    const r1 = (v: number | null) => v !== null ? Math.round(v * 10) / 10 : null;

    // 7일 × 8슬롯
    return Array.from({ length: 7 }, (_, i) => {
      const date    = new Date(Date.UTC(y, mo, d + i));
      const dateStr = date.toISOString().slice(0, 10); // "YYYY-MM-DD"

      return SLOT_HOURS.map(hour => {
        const key  = `${dateStr}T${String(hour).padStart(2, '0')}:00`;
        const m    = mByT[key] ?? { wh: null, wp: null, st: null };
        const w    = wByT[key] ?? { at: null, ws: null, wd: null, wc: null };
        const code = w.wc ?? 0;
        return {
          hour,
          airTemp:      r1(w.at),
          windSpeed:    w.ws !== null ? Math.round(w.ws) : null,
          windDir:      w.wd !== null ? Math.round(w.wd) : null,
          weatherCode:  code,
          weatherIcon:  wmoIcon(code),
          weatherLabel: wmoLabel(code),
          waveHeight:   r1(m.wh),
          wavePeriod:   r1(m.wp),
          seaTemp:      r1(m.st),
        } satisfies WeatherSlot;
      });
    });
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url  = new URL(req.url);
  const code = url.searchParams.get('code') ?? 'DT_0001';
  const lat  = parseFloat(url.searchParams.get('lat') ?? '0');
  const lng  = parseFloat(url.searchParams.get('lng') ?? '0');
  const now  = new Date();
  const date =
    url.searchParams.get('date') ??
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  try {
    const [weekly, weather] = await Promise.all([
      fetchWeekly(code, date),
      (lat && lng) ? fetchMarineWeather(lat, lng, date) : Promise.resolve(null),
    ]);

    if (hasData(weekly)) {
      return NextResponse.json({ code, weekly, fallback: null, weather });
    }

    if (!lat || !lng) {
      return NextResponse.json({ code, weekly, fallback: null, weather });
    }

    const stations: TideStation[] = allStations;

    const sorted = stations
      .filter(s => s.code !== code)
      .map(s => ({ ...s, dist: haversineKm(lat, lng, s.lat, s.lng) }))
      .sort((a, b) => a.dist - b.dist);

    for (const station of sorted.slice(0, 8)) {
      const fallbackWeekly = await fetchWeekly(station.code, date);
      if (hasData(fallbackWeekly)) {
        return NextResponse.json({
          code,
          weekly: fallbackWeekly,
          fallback: { name: station.name, distKm: Math.round(station.dist) },
          weather,
        });
      }
    }

    return NextResponse.json({ code, weekly, fallback: null, weather });
  } catch {
    return NextResponse.json({ code, weekly: [], fallback: null, weather: null }, { status: 500 });
  }
}

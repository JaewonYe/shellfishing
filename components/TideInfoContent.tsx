'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

export interface TideStationInfo {
  code: string;
  name: string;
  sea: string;
  lat: number;
  lng: number;
}

interface Extremum {
  time: string;
  type: 'high' | 'low';
  height: number;
}

interface DayData {
  date: string;
  lunarDate: string;
  tideName: string;
  moonState: string;
  extrema: Extremum[];
}

interface WeatherSlot {
  hour:         number;
  airTemp:      number | null;
  windSpeed:    number | null;
  windDir:      number | null;
  weatherCode:  number | null;
  weatherIcon:  string;
  weatherLabel: string;
  waveHeight:   number | null;
  wavePeriod:   number | null;
  seaTemp:      number | null;
}

function windDirLabel(deg: number | null): string {
  if (deg === null) return '';
  const dirs = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  return dirs[Math.round(deg / 45) % 8];
}


interface TideInfoContentProps {
  station: TideStationInfo;
  onClose: () => void;
}

const SEA_COLOR: Record<string, string> = {
  '서해': '#1565c0',
  '남해': '#00838f',
  '동해': '#1b5e20',
  '제주': '#6a1b9a',
};

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// 절대 시간(분) 기준 극값들을 보간해 연속 곡선을 생성한다.
// 여러 날을 이어 붙인 타임라인에서도 경계 없이 자연스럽게 흐르도록
// 시작/끝 구간은 인접 극값을 미러링한 가상 극값으로 보정한다.
function buildContinuousCurve(
  points: { t: number; h: number }[],
  totalMinutes: number,
  stepMinutes = 15
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return [{ x: 0, y: points[0].h }, { x: totalMinutes, y: points[0].h }];
  }

  const n = points.length;
  const virtualPrev = { t: points[0].t - (points[1].t - points[0].t), h: points[1].h };
  const virtualNext = { t: points[n - 1].t + (points[n - 1].t - points[n - 2].t), h: points[n - 2].h };
  const ext = [virtualPrev, ...points, virtualNext];

  const steps = Math.round(totalMinutes / stepMinutes);
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalMinutes;

    let prev = ext[0], next = ext[1];
    for (let j = 0; j < ext.length - 1; j++) {
      if (ext[j].t <= t && ext[j + 1].t >= t) {
        prev = ext[j];
        next = ext[j + 1];
        break;
      }
    }

    const span = next.t - prev.t;
    const pos  = span > 0 ? (t - prev.t) / span : 0;
    const h    = (prev.h + next.h) / 2 + ((prev.h - next.h) / 2) * Math.cos(Math.PI * pos);
    result.push({ x: t, y: h });
  }
  return result;
}

// 하루치 그래프의 가로 폭(px). 여러 날의 그래프를 이 폭만큼씩 이어 붙여
// 하나의 연속된 타임라인으로 만들고, 가로 스크롤로 넘나들며 조회한다.
const DAY_W = 220;

function MultiDayTideChart({
  weekly,
  weather,
  color,
  scrollRef,
}: {
  weekly: DayData[];
  weather: WeatherSlot[][] | null;
  color: string;
  scrollRef: RefObject<HTMLDivElement>;
}) {
  // ── 레이아웃 상수 ──────────────────────────────────
  const PL      = 34;                  // 좌측 Y축·행 라벨 폭 (스크롤과 무관하게 고정 표시)
  const DATE_Y  = 9;                    // 날짜 라벨
  const TIDE_T  = 20;                   // 조석 차트 시작
  const TIDE_H  = 78;                   // 조석 차트 높이
  const TIDE_B  = TIDE_T + TIDE_H;      // 98 — 조석 차트 하단
  const XLAB_Y  = TIDE_B + 16;          // 114 — 시각 레이블

  // 날씨 섹션 y 좌표 (날씨 데이터 있을 때만 사용)
  const W_SEP   = XLAB_Y + 6;           // 120 — 구분선
  const W_ICO   = W_SEP  + 13;          // 133 — 날씨 이모지 중심
  const W_TMP   = W_SEP  + 25;          // 145 — 기온 텍스트
  const W_WND   = W_SEP  + 35;          // 155 — 바람 텍스트
  const W_WVTOP = W_SEP  + 41;          // 161 — 파고 바 상단
  const W_WVBOT = W_WVTOP + 15;         // 176 — 파고 바 하단
  const W_STP   = W_WVBOT + 10;         // 186 — 수온 텍스트

  const hasWeather = !!(weather && weather.some(s => s && s.length > 0));
  const H = hasWeather ? W_STP + 6 : XLAB_Y + 5;

  const days = weekly.length;
  if (days === 0) {
    return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">데이터 없음</div>;
  }

  // ── 전체 기간 극값을 절대 분(分) 단위로 환산해 하나의 곡선으로 통합 ──
  const allExtrema = weekly.flatMap((d, di) =>
    d.extrema.map(e => ({ ...e, abs: di * 1440 + timeToMins(e.time) }))
  );
  if (allExtrema.length === 0) {
    return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">데이터 없음</div>;
  }

  const totalMinutes = days * 1440;
  const chartW = days * DAY_W;
  const toX = (t: number) => (t / 1440) * DAY_W;

  const heights = allExtrema.map(e => e.height);
  const rawMin  = Math.min(...heights);
  const rawMax  = Math.max(...heights);
  const padH    = (rawMax - rawMin) * 0.12 || 50;
  const minH    = rawMin - padH;
  const hRange  = (rawMax + padH) - minH;
  const toY = (h: number) => TIDE_T + TIDE_H - ((h - minH) / hRange) * TIDE_H;

  const curve = buildContinuousCurve(allExtrema.map(e => ({ t: e.abs, h: e.height })), totalMinutes);
  const linePath = curve.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`
  ).join('');
  const areaPath =
    `${linePath}L${toX(totalMinutes).toFixed(1)},${TIDE_B}L${toX(0).toFixed(1)},${TIDE_B}Z`;

  const now    = new Date();
  const nowAbs = now.getHours() * 60 + now.getMinutes();   // 오늘(0번째 날) 기준 절대 분
  const yTicks = [Math.round(rawMin), Math.round((rawMin + rawMax) / 2), Math.round(rawMax)];
  const gradId = `mtg${weekly[0].date.replace(/-/g, '')}`;

  // ── 날씨 슬롯 좌표 계산 ────────────────────────────
  const slotW    = DAY_W / 8;                                          // 3시간 = 하루의 1/8
  const slotAbsX = (di: number, hour: number) => toX(di * 1440 + hour * 60);
  const slotCX   = (di: number, hour: number) => slotAbsX(di, hour) + slotW / 2;
  const curSlot  = Math.floor(now.getHours() / 3) * 3;
  const maxWave  = hasWeather
    ? Math.max(...weekly.map((_, di) => weather?.[di] ?? []).flat().map(s => s.waveHeight ?? 0), 0.1)
    : 0.1;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        <svg width={chartW} height={H} viewBox={`0 0 ${chartW} ${H}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* 현재 3시간 슬롯 — 오늘 컬럼 하이라이트 (곡선 뒤에 위치하도록 먼저 그림) */}
          {hasWeather && (
            <rect
              x={slotAbsX(0, curSlot)} y={TIDE_T}
              width={slotW} height={H - TIDE_T}
              fill="rgba(1,119,188,0.06)" rx="2"
            />
          )}

          {/* 일자 경계선 · 날짜 라벨 · 시간 격자 */}
          {weekly.map((d, di) => {
            const x0 = toX(di * 1440);
            const parts = d.date.split('-');
            const label = di === 0 ? '오늘' : `${parts[1]}/${parts[2]}`;
            return (
              <g key={d.date}>
                <line x1={x0} y1={TIDE_T} x2={x0} y2={H} stroke="#d1d5db" strokeWidth="0.8" />
                {[6, 12, 18].map(h => (
                  <line key={h}
                    x1={toX(di * 1440 + h * 60)} y1={TIDE_T}
                    x2={toX(di * 1440 + h * 60)} y2={TIDE_B}
                    stroke="#e5e7eb" strokeWidth="0.6" />
                ))}
                <text x={x0 + DAY_W / 2} y={DATE_Y} textAnchor="middle" fontSize="7.5"
                  fontWeight={di === 0 ? 700 : 500}
                  fill={di === 0 ? color : '#9ca3af'}>
                  {label} · {d.tideName}
                </text>
                {[6, 12, 18].map(h => (
                  <text key={h} x={toX(di * 1440 + h * 60)} y={XLAB_Y} textAnchor="middle" fontSize="7" fill="#c0c0c0">
                    {h}시
                  </text>
                ))}
              </g>
            );
          })}
          <line x1={chartW} y1={TIDE_T} x2={chartW} y2={H} stroke="#d1d5db" strokeWidth="0.8" />

          {/* Y 격자 */}
          {yTicks.map(v => (
            <line key={v} x1={0} y1={toY(v)} x2={chartW} y2={toY(v)} stroke="#e5e7eb" strokeWidth="0.6" />
          ))}

          {/* 조석 면적 + 곡선 (전체 기간이 끊김 없이 하나로 이어짐) */}
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

          {/* 현재 시각 선 (오늘 컬럼) */}
          <line
            x1={toX(nowAbs)} y1={TIDE_T}
            x2={toX(nowAbs)} y2={H}
            stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2"
          />

          {/* 고/저조 마커 + 시각·물높이 라벨 (고조는 점 위, 저조는 점 아래에 배치해 곡선과 겹치지 않게) */}
          {allExtrema.map((e, i) => {
            const cx = toX(e.abs);
            const cy = toY(e.height);
            const isHigh    = e.type === 'high';
            const markColor = isHigh ? '#ef4444' : '#3b82f6';
            const lineY1 = isHigh ? cy - 12 : cy + 10;
            const lineY2 = isHigh ? cy - 4  : cy + 18;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="3.5" fill={markColor} stroke="white" strokeWidth="1.2" />
                <text x={cx} y={lineY1} textAnchor="middle" fontSize="7" fontWeight="700" fill={markColor}>
                  {(isHigh ? '▲ ' : '▼ ') + e.time}
                </text>
                <text x={cx} y={lineY2} textAnchor="middle" fontSize="6.5" fill="#9ca3af">
                  {e.height}cm
                </text>
              </g>
            );
          })}

          {/* ── 날씨 동기화 섹션 ───────────────────────── */}
          {hasWeather && (
            <>
              {weekly.map((d, di) => (
                <line key={d.date} x1={di * DAY_W} y1={W_SEP} x2={(di + 1) * DAY_W} y2={W_SEP}
                  stroke="#e5e7eb" strokeWidth="0.8" />
              ))}

              {weekly.map((d, di) => (weather?.[di] ?? []).map(slot => {
                const cx    = slotCX(di, slot.hour);
                const isAct = di === 0 && slot.hour === curSlot;

                const bh = slot.waveHeight !== null
                  ? Math.max(2, (slot.waveHeight / maxWave) * 15)
                  : 0;
                const by = W_WVBOT - bh;

                return (
                  <g key={`${d.date}-${slot.hour}`}>
                    <text x={cx} y={W_ICO} textAnchor="middle" fontSize="11" dominantBaseline="middle">
                      {slot.weatherIcon}
                    </text>

                    {slot.airTemp !== null && (
                      <text x={cx} y={W_TMP} textAnchor="middle" fontSize="7.5"
                        fill={isAct ? '#0277bd' : '#374151'} fontWeight={isAct ? 'bold' : 'normal'}
                        dominantBaseline="middle">
                        {slot.airTemp}°
                      </text>
                    )}

                    {slot.windSpeed !== null && (
                      <text x={cx} y={W_WND} textAnchor="middle" fontSize="6.5"
                        fill="#9ca3af" dominantBaseline="middle">
                        {windDirLabel(slot.windDir)} {slot.windSpeed}
                      </text>
                    )}

                    {slot.waveHeight !== null && (
                      <>
                        <rect x={slotAbsX(di, slot.hour) + 2} y={by} width={slotW - 4} height={bh}
                          fill={isAct ? '#60a5fa' : '#93c5fd'} rx="1.5" />
                        <text x={cx} y={by - 2} textAnchor="middle" fontSize="6"
                          fill="#3b82f6" dominantBaseline="auto">
                          {slot.waveHeight}
                        </text>
                      </>
                    )}

                    {slot.seaTemp !== null && (
                      <text x={cx} y={W_STP} textAnchor="middle" fontSize="7"
                        fill={isAct ? '#0284c7' : '#60a5fa'} dominantBaseline="middle">
                        {slot.seaTemp}°
                      </text>
                    )}
                  </g>
                );
              }))}
            </>
          )}
        </svg>
      </div>

      {/* 좌측 Y축·행 라벨 — 스크롤과 무관하게 항상 고정 표시되는 오버레이 */}
      <svg className="absolute top-0 left-0 pointer-events-none" width={PL} height={H} viewBox={`0 0 ${PL} ${H}`}>
        <rect x="0" y="0" width={PL} height={H} fill="#f9fafb" />
        {yTicks.map(v => (
          <text key={v} x={PL - 3} y={toY(v) + 3.5} textAnchor="end" fontSize="7.5" fill="#9ca3af">
            {v}
          </text>
        ))}
        {hasWeather && (
          <>
            {[['날씨', W_ICO], ['기온', W_TMP], ['바람', W_WND], ['수온', W_STP]].map(([label, y]) => (
              <text key={label as string} x={PL - 3} y={y as number}
                textAnchor="end" fontSize="6" fill="#c0c0c0" dominantBaseline="middle">
                {label}
              </text>
            ))}
            <text x={PL - 3} y={(W_WVTOP + W_WVBOT) / 2}
              textAnchor="end" fontSize="6" fill="#c0c0c0" dominantBaseline="middle">
              파고
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

interface FallbackInfo {
  name: string;
  distKm: number;
}

export default function TideInfoContent({ station, onClose }: TideInfoContentProps) {
  const [weekly, setWeekly] = useState<DayData[] | null>(null);
  const [weather, setWeather] = useState<WeatherSlot[][] | null>(null);
  const [fallback, setFallback] = useState<FallbackInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWeekly(null);
    setWeather(null);
    setFallback(null);
    setLoading(true);
    scrollRef.current?.scrollTo({ left: 0 });

    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    fetch(`/api/tide-detail?code=${station.code}&date=${date}&lat=${station.lat}&lng=${station.lng}`)
      .then(r => r.json())
      .then(data => {
        setWeekly(data.weekly ?? []);
        setWeather(data.weather ?? null);
        setFallback(data.fallback ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [station]);

  const color = SEA_COLOR[station.sea] ?? '#1565c0';

  return (
    <div className="px-4 pb-5 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <h2 className="text-base font-bold text-gray-900">{station.name}</h2>
          <span className="text-xs text-gray-400">{station.sea}</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg active:opacity-70"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      {/* Fallback notice */}
      {!loading && fallback && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <p className="text-xs text-amber-700 leading-snug">
            <span className="font-semibold">{station.name}</span>의 상세 물때 정보가 없습니다.
            <br/>가장 가까운 <span className="font-semibold">{fallback.name}</span>({fallback.distKm}km) 기준으로 표시합니다.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          불러오는 중…
        </div>
      )}

      {/* Content */}
      {!loading && weekly && (
        <>
          {/* 모든 날짜의 물때 + 날씨를 하나로 이어붙인 연속 그래프.
              날짜 라벨이 그래프 위에 함께 그려져 가로 스크롤하면 그래프와 동기화되어 이동한다. */}
          <div className="rounded-xl overflow-hidden bg-gray-50 mb-3 px-1 pt-1">
            <MultiDayTideChart
              weekly={weekly}
              weather={weather}
              color={color}
              scrollRef={scrollRef}
            />
          </div>
        </>
      )}

      {!loading && weekly === null && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          데이터를 불러올 수 없습니다
        </div>
      )}
    </div>
  );
}

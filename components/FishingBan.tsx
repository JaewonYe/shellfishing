'use client';

import { useState, useMemo } from 'react';

// ── 타입 ──────────────────────────────────────────
type Category = '어류' | '갑각류' | '연체류' | '패류';
type SeaArea  = '전국' | '서해' | '남해' | '동해' | '제주';
type Status   = 'ending-soon' | 'banned' | 'starting-soon' | 'normal' | 'no-ban' | 'n/a';

interface BanRule {
  from: [number, number]; // [월, 일] 1-indexed
  to:   [number, number];
}

/** 단일 지역 금어기 항목 */
interface BanItem {
  label:   string;    // 표시 레이블: '전국', '경남', '서해5도', '충남 가로림만'
  regions: string[];  // 매핑용: ['전국'], ['경남'], ['서해5도'] …
  ban:     BanRule;
  note?:   string;    // 비고 (어업 방법 등)
}

interface SpeciesData {
  id:        string;
  emoji:     string;
  name:      string;
  sub?:      string;
  category:  Category;
  bans:      BanItem[];   // 지역별 금어기 (비어있으면 금어기 없음)
  extraBan?: string;      // 연중금지 등 별도 문구
  minSize?:  string;      // 포획금지체장
  notes?:    string[];    // 추가 정보
}

// ── 지역 → 해역 매핑 ──────────────────────────────
const REGION_TO_AREA: Record<string, SeaArea[]> = {
  '전국':       ['서해', '남해', '동해', '제주'],
  '서해':       ['서해'],
  '서해5도':    ['서해'],
  '인천':       ['서해'],
  '경기':       ['서해'],
  '인천·경기':  ['서해'],
  '충남':       ['서해'],
  '충남 가로림만': ['서해'],
  '남해':       ['남해'],
  '전남':       ['남해'],
  '경남':       ['남해'],
  '동해':       ['동해'],
  '강원':       ['동해'],
  '경북':       ['동해'],
  '제주':       ['제주'],
};

function areaMatches(regions: string[], area: SeaArea): boolean {
  if (area === '전국') return true;
  return regions.some(r => (REGION_TO_AREA[r] ?? []).includes(area));
}

function getApplicable(bans: BanItem[], area: SeaArea): BanItem[] {
  return bans.filter(b => areaMatches(b.regions, area));
}

// ── 금어기 데이터 (해양수산부·수산자원관리법 2025년 기준) ──
const SPECIES: SpeciesData[] = [
  // ── 어류 ───────────────────────────────────────
  {
    id: 'flatfish', emoji: '🐟', name: '가자미류', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [12, 1], to: [1, 31] } }],
    minSize: '전장 20cm 미만',
  },
  {
    id: 'cod', emoji: '🐟', name: '대구', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [1, 16], to: [2, 15] } }],
    minSize: '전장 35cm 미만',
  },
  {
    id: 'rockfish', emoji: '🐟', name: '조피볼락', sub: '우럭', category: '어류',
    bans: [],
    minSize: '전장 23cm 미만',
    notes: ['법정 금어기 없음 (금지체장만 적용)'],
  },
  {
    id: 'puffer', emoji: '🐡', name: '황복', category: '어류',
    bans: [],
    notes: ['2023년 개정으로 금어기·금지체장 모두 폐지'],
  },
  {
    id: 'mackerel-s', emoji: '🐟', name: '삼치', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [5, 1], to: [5, 31] } }],
  },
  {
    id: 'bream-b', emoji: '🐟', name: '감성돔', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [5, 1], to: [5, 31] } }],
    minSize: '전장 25cm 미만',
  },
  {
    id: 'bream-r', emoji: '🐟', name: '참돔', category: '어류',
    bans: [],
    minSize: '전장 24cm 미만',
    notes: ['법정 금어기 없음 (금지체장만 적용)'],
  },
  {
    id: 'gizzard', emoji: '🐟', name: '전어', category: '어류',
    bans: [{ label: '전국 (강원·경북 제외)', regions: ['서해', '남해', '제주'], ban: { from: [5, 1], to: [7, 15] } }],
  },
  {
    id: 'mackerel', emoji: '🐟', name: '고등어', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [4, 12], to: [5, 12] } }],
    minSize: '전장 21cm 미만',
    notes: ['4/1~6/30 중 1개월(연도별 해양수산부 고시로 확정) · 소형선망·제주정치망은 4/1~4/30'],
  },
  {
    id: 'seabass', emoji: '🐟', name: '농어', category: '어류',
    bans: [],
    minSize: '전장 30cm 미만',
    notes: ['법정 금어기 없음 (금지체장만 적용)'],
  },
  {
    id: 'hairtail', emoji: '🐟', name: '갈치', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [7, 1], to: [7, 31] } }],
    minSize: '항문장 18cm 미만',
    notes: ['근해채낚기·연안복합어업은 적용 제외'],
  },
  {
    id: 'croaker', emoji: '🐟', name: '참조기', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [7, 1], to: [7, 31] } }],
    minSize: '전장 15cm 미만',
    notes: ['유자망어업: 4/22~8/10 (어업 방법 별도)'],
  },
  {
    id: 'skate', emoji: '🐟', name: '참홍어', category: '어류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [6, 1], to: [7, 15] } }],
    minSize: '항문장 42cm 미만',
  },
  {
    id: 'flounder', emoji: '🐟', name: '넙치', sub: '광어', category: '어류',
    bans: [{ label: '제주', regions: ['제주'], ban: { from: [9, 1], to: [11, 30] } }],
    minSize: '전장 35cm 미만',
    notes: ['제주 외 지역은 법정 금어기 없음 (지자체 고시로 별도 지정 가능)'],
  },

  // ── 갑각류 ─────────────────────────────────────
  {
    // 꽃게: 전국 기본 + 서해5도 별도
    id: 'crab-blue', emoji: '🦀', name: '꽃게', category: '갑각류',
    bans: [
      { label: '전국 (제주·서해5도 제외)', regions: ['서해', '남해', '동해'], ban: { from: [6, 21], to: [8, 20] } },
      { label: '서해5도',                  regions: ['서해5도'],              ban: { from: [7,  1], to: [8, 31] } },
    ],
    minSize: '갑폭 6.4cm 미만',
    extraBan: '알품은 꽃게 연중 포획금지',
  },
  {
    // 대게: 동해 한정 어종
    id: 'crab-snow', emoji: '🦀', name: '대게', sub: '수컷', category: '갑각류',
    bans: [{ label: '동해', regions: ['동해'], ban: { from: [6, 1], to: [11, 30] } }],
    minSize: '두흉갑장 9cm 미만',
    extraBan: '암컷 연중 포획금지',
    notes: ['동해 서식 어종'],
  },
  {
    // 붉은대게: 동해 한정
    id: 'crab-red', emoji: '🦀', name: '붉은대게', sub: '수컷', category: '갑각류',
    bans: [{ label: '동해', regions: ['동해'], ban: { from: [7, 10], to: [8, 25] } }],
    extraBan: '암컷 연중 포획금지',
    notes: ['동해 서식 어종', '강원 연안자망어업: 6/1~7/10'],
  },
  {
    id: 'shrimp-pearl', emoji: '🦐', name: '펄닭새우', sub: '보리새우류', category: '갑각류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [6, 1], to: [8, 31] } }],
    minSize: '10cm 미만',
  },

  // ── 연체류 ─────────────────────────────────────
  {
    id: 'squid', emoji: '🦑', name: '살오징어', category: '연체류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [4, 1], to: [5, 31] } }],
    minSize: '외투장 15cm 미만',
    notes: ['근해채낚기·연안복합·정치망어업은 4/1~4/30'],
  },
  {
    id: 'octopus-b', emoji: '🐙', name: '주꾸미', category: '연체류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [5, 11], to: [8, 31] } }],
  },
  {
    id: 'octopus-r', emoji: '🐙', name: '참문어', category: '연체류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [5, 16], to: [6, 30] } }],
    minSize: '몸무게 400g 미만',
  },
  {
    id: 'cuttlefish', emoji: '🦑', name: '갑오징어', category: '연체류',
    bans: [],
    notes: ['법정 금어기 없음 (2025년 기준 미지정)'],
  },
  {
    // 낙지: 지역별 금어기 가장 복잡
    id: 'octopus-w', emoji: '🐙', name: '낙지', category: '연체류',
    bans: [
      { label: '전국 기본',        regions: ['전국'],          ban: { from: [6,  1], to: [6, 30] } },
      { label: '경남',             regions: ['경남'],          ban: { from: [6, 16], to: [7, 31] } },
      { label: '전남·인천·경기',   regions: ['전남', '인천·경기'], ban: { from: [6, 21], to: [7, 20] } },
      { label: '충남 가로림만',    regions: ['충남'],          ban: { from: [4,  1], to: [5, 31] } },
    ],
    notes: ['지역별 금어기 별도 적용 — 상세 내용은 시·도 공고 확인'],
  },

  // ── 패류 ───────────────────────────────────────
  {
    // 전복: 전국(제주 제외) + 제주 별도
    id: 'abalone', emoji: '🐚', name: '전복', category: '패류',
    bans: [
      { label: '전국 (제주 제외)', regions: ['서해', '남해', '동해'], ban: { from: [9,  1], to: [10, 31] } },
      { label: '제주',             regions: ['제주'],                  ban: { from: [10, 1], to: [12, 31] } },
    ],
    minSize: '각장 7cm 미만 (제주 10cm)',
  },
  {
    id: 'fan-shell', emoji: '🐚', name: '키조개', category: '패류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [7, 1], to: [8, 31] } }],
    minSize: '각장 18cm 미만 (부산·경남·강원·경북)',
  },
  {
    // 새조개: 부산·울산·경남·전남(무안·영광 제외)·제주는 6/1부터, 그 외는 6/16부터
    id: 'cockle', emoji: '🐚', name: '새조개', category: '패류',
    bans: [
      { label: '부산·울산·경남·전남·제주', regions: ['남해', '제주'], ban: { from: [6, 1], to: [9, 30] } },
      { label: '그 외 지역',               regions: ['서해', '동해'], ban: { from: [6, 16], to: [9, 30] } },
    ],
  },
  {
    id: 'clam-hard', emoji: '🐚', name: '백합', category: '패류',
    bans: [{ label: '전국', regions: ['전국'], ban: { from: [7, 1], to: [8, 20] } }],
    minSize: '각장 5cm 미만',
  },
  {
    // 소라: 전남·제주, 제주 추자면, 경북 울릉 별도
    id: 'turban-shell', emoji: '🐚', name: '소라', category: '패류',
    bans: [
      { label: '전남·제주',   regions: ['전남', '제주'], ban: { from: [6, 1], to: [8, 31] } },
      { label: '제주 추자면', regions: ['제주'],         ban: { from: [7, 1], to: [9, 30] } },
      { label: '경북 울릉',   regions: ['경북'],         ban: { from: [6, 1], to: [9, 30] } },
    ],
    minSize: '각장 5cm 미만 (제주 7cm)',
    notes: ['지역별 금어기 별도 적용 — 상세 내용은 시·도 공고 확인'],
  },
];

// ── 날짜 유틸 ──────────────────────────────────────
const MONTH_START    = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function doy(month: number, day: number) { return MONTH_START[month - 1] + day; }

function isInBan(ban: BanRule, d: number): boolean {
  const s = doy(...ban.from), e = doy(...ban.to);
  return s <= e ? d >= s && d <= e : d >= s || d <= e;
}

function daysToEnd(ban: BanRule, d: number): number {
  const e = doy(...ban.to);
  const diff = e - d;
  return diff < 0 ? diff + 365 : diff;
}

function daysToStart(ban: BanRule, d: number): number {
  const s = doy(...ban.from);
  const diff = s - d;
  return diff <= 0 ? diff + 365 : diff;
}

function getStatusInfo(bans: BanItem[], area: SeaArea, todayDoy: number): {
  status: Status; daysLeft?: number; daysUntil?: number;
} {
  const applicable = getApplicable(bans, area);
  if (bans.length > 0 && applicable.length === 0) return { status: 'n/a' };
  if (applicable.length === 0)                     return { status: 'no-ban' };

  const active = applicable.filter(b => isInBan(b.ban, todayDoy));
  if (active.length > 0) {
    const daysLeft = Math.min(...active.map(b => daysToEnd(b.ban, todayDoy)));
    return { status: daysLeft <= 14 ? 'ending-soon' : 'banned', daysLeft };
  }

  const upcoming = applicable.map(b => daysToStart(b.ban, todayDoy));
  const daysUntil = Math.min(...upcoming);
  return { status: daysUntil <= 14 ? 'starting-soon' : 'normal', daysUntil };
}

function banSegments(ban: BanRule): { left: number; width: number }[] {
  const s = doy(...ban.from), e = doy(...ban.to);
  if (s <= e) return [{ left: (s-1)/365*100, width: (e-s+1)/365*100 }];
  return [
    { left: (s-1)/365*100, width: (365-s+1)/365*100 },
    { left: 0,             width: e/365*100 },
  ];
}

const STATUS_ORDER: Record<Status, number> = {
  'ending-soon': 0, 'banned': 1, 'starting-soon': 2, 'normal': 3, 'no-ban': 4, 'n/a': 5,
};

// ── 금지체장 뷰 ────────────────────────────────────
function parseSize(s: string): { value: number; unit: string } | null {
  const cm = s.match(/(\d+(?:\.\d+)?)\s*cm/);
  if (cm) return { value: parseFloat(cm[1]), unit: 'cm' };
  const g = s.match(/(\d+(?:\.\d+)?)\s*g/);
  if (g)  return { value: parseFloat(g[1]),  unit: 'g' };
  return null;
}

const MEASURE_LABEL: Record<string, string> = {
  '전장': '전장(몸통 전체 길이)',
  '항문장': '항문장(몸통 앞~항문)',
  '갑폭': '갑폭(등딱지 너비)',
  '두흉갑장': '두흉갑장(두흉부 길이)',
  '각장': '각장(껍데기 길이)',
  '외투장': '외투장(외투막 길이)',
  '몸무게': '몸무게',
};

function getMeasureType(s: string): string {
  for (const key of Object.keys(MEASURE_LABEL)) {
    if (s.startsWith(key)) return key;
  }
  return '';
}

function MinSizeView({ filter }: { filter: FilterCat }) {
  const list = (filter === '전체' ? SPECIES : SPECIES.filter(s => s.category === filter));

  const withSize = list.filter(s => s.minSize);

  // Max cm value across displayed species for bar scaling
  const maxCm = Math.max(
    1,
    ...withSize.map(s => parseSize(s.minSize!)?.unit === 'cm' ? parseSize(s.minSize!)!.value : 0),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="divide-y divide-gray-100">
        {withSize.map(sp => {
          const parsed      = parseSize(sp.minSize!);
          const measureType = getMeasureType(sp.minSize!);
          const isCm        = parsed?.unit === 'cm';
          const isG         = parsed?.unit === 'g';
          const pct         = isCm ? (parsed!.value / maxCm) * 100 : 0;

          return (
            <div key={sp.id} className="px-4 py-4 bg-white">
              {/* 종명 + 측정 기준 + 수치 */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl leading-none flex-shrink-0">{sp.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">{sp.name}</span>
                      {sp.sub && <span className="text-xs text-gray-400">({sp.sub})</span>}
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{sp.category}</span>
                    </div>
                    {measureType && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{MEASURE_LABEL[measureType]}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400 mb-0.5">포획금지 기준</p>
                  <p className="text-base font-bold text-blue-600 tabular-nums leading-tight">{sp.minSize}</p>
                  <p className="text-[10px] text-blue-400 font-medium">미만 금지</p>
                </div>
              </div>

              {/* 시각적 막대 (cm 기준) */}
              {isCm && (
                <div>
                  <div className="flex justify-between text-[9px] text-gray-300 mb-1">
                    <span>0</span>
                    <span className="font-medium text-blue-400">{parsed!.value}cm</span>
                    <span>{maxCm}cm</span>
                  </div>
                  <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    {/* 금지 구간 (0 ~ 기준 체장) */}
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-400 rounded-full flex items-center justify-end pr-1.5"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 18 && (
                        <span className="text-[8px] text-white font-bold">&lt;{parsed!.value}cm</span>
                      )}
                    </div>
                    {/* 허용 구간 */}
                    <div
                      className="absolute top-0 h-full bg-green-100"
                      style={{ left: `${pct}%`, right: 0 }}
                    />
                    {/* 기준선 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
                      style={{ left: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] mt-1">
                    <span className="text-blue-500 font-medium">포획 금지</span>
                    <span className="text-green-600 font-medium">포획 가능</span>
                  </div>
                </div>
              )}

              {/* 무게 기준 시각화 */}
              {isG && (
                <div className="mt-1 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-700">{parsed!.value}g 미만 포획금지</p>
                    <p className="text-[10px] text-blue-400">무게 기준 적용 (길이 기준 없음)</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <p className="py-5 text-center text-[10px] text-gray-300 px-6">
          수산자원관리법 시행령 별표 기준 · 정확한 내용은 해양수산부 공고 확인
        </p>
      </div>
    </div>
  );
}

// ── 상태 뱃지 ──────────────────────────────────────
function StatusBadge({ bans, area, todayDoy }: { bans: BanItem[]; area: SeaArea; todayDoy: number }) {
  const { status, daysLeft, daysUntil } = getStatusInfo(bans, area, todayDoy);
  const b = 'text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap';
  if (status === 'n/a')          return <span className={`${b} bg-gray-100 text-gray-400`}>해역 미해당</span>;
  if (status === 'no-ban')       return <span className={`${b} bg-gray-100 text-gray-400`}>체장만</span>;
  if (status === 'ending-soon')  return <span className={`${b} bg-orange-100 text-orange-600`}>D-{daysLeft} 종료</span>;
  if (status === 'banned')       return <span className={`${b} bg-red-100 text-red-600`}>금어기 중</span>;
  if (status === 'starting-soon') return <span className={`${b} bg-amber-100 text-amber-700`}>D-{daysUntil} 시작</span>;
  return                                 <span className={`${b} bg-green-100 text-green-700`}>정상</span>;
}

// ── 미니 타임라인 (지역별 행에 사용) ───────────────
function MiniBar({ ban, todayDoy, isNational }: { ban: BanRule; todayDoy: number; isNational: boolean }) {
  const segs = banSegments(ban);
  const pct  = (todayDoy - 1) / 365 * 100;
  return (
    <div className="relative">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
        {segs.map((s, i) => (
          <div key={i}
            className={`absolute top-0 h-full rounded-full ${isNational ? 'bg-red-300' : 'bg-red-500'}`}
            style={{ left: `${s.left}%`, width: `${s.width}%` }}
          />
        ))}
      </div>
      <div className="absolute w-px bg-blue-400 z-10" style={{ left: `${pct}%`, top: 0, bottom: 0 }} />
    </div>
  );
}

// ── 메인 타임라인 ──────────────────────────────────
function TimelineBar({ bans, area, todayDoy }: { bans: BanItem[]; area: SeaArea; todayDoy: number }) {
  const applicable = getApplicable(bans, area);
  const todayPct   = (todayDoy - 1) / 365 * 100;
  const hasMulti   = bans.length > 1;

  // 전국 뷰: 전국 규정 = 연한 빨강, 지역 특수 규정 = 진한 빨강
  // 특정 해역 뷰: 모두 같은 색
  const getColor = (item: BanItem) => {
    if (area !== '전국') return 'bg-red-400';
    const isNat = item.regions.includes('전국') || item.regions.length >= 3;
    return isNat ? 'bg-red-300' : 'bg-red-500';
  };

  return (
    <div className="relative mt-2.5">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
        {applicable.flatMap((item, i) =>
          banSegments(item.ban).map((seg, j) => (
            <div key={`${i}-${j}`}
              className={`absolute top-0 h-full ${getColor(item)}`}
              style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
            />
          ))
        )}
      </div>
      <div className="absolute w-px bg-blue-500 z-10"
        style={{ left: `${todayPct}%`, top: '-2px', bottom: '-10px' }}
      />
      <div className="flex text-[8px] text-gray-300 leading-none mt-1 select-none">
        {DAYS_PER_MONTH.map((d, i) => (
          <div key={i} style={{ flex: d }} className="text-center">{i + 1}</div>
        ))}
      </div>
      {/* 지역별 색상 범례 (전국 뷰 + 지역 규정 있는 경우) */}
      {area === '전국' && hasMulti && applicable.length > 0 && (
        <div className="flex gap-2 mt-1.5">
          {bans.some(b => b.regions.includes('전국') || b.regions.length >= 3) && (
            <span className="flex items-center gap-1 text-[9px] text-gray-400">
              <span className="inline-block w-3 h-1.5 rounded-full bg-red-300" />전국
            </span>
          )}
          {bans.some(b => !b.regions.includes('전국') && b.regions.length < 3) && (
            <span className="flex items-center gap-1 text-[9px] text-gray-400">
              <span className="inline-block w-3 h-1.5 rounded-full bg-red-500" />지역별
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── 지역별 규정 테이블 (펼침 시) ──────────────────
function RegionalTable({ bans, area, todayDoy }: { bans: BanItem[]; area: SeaArea; todayDoy: number }) {
  function fmtMD([m, d]: [number, number]) { return `${m}/${d}`; }
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {bans.map((item, i) => {
        const applicable = areaMatches(item.regions, area);
        const active     = applicable && isInBan(item.ban, todayDoy);
        return (
          <div key={i} className={`rounded-lg px-3 py-2 ${applicable ? 'bg-white border' : 'bg-gray-50 border border-dashed'} border-gray-200`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded
                  ${applicable ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                  {item.label}
                </span>
                {active && <span className="text-[10px] text-red-500 font-bold">● 금어기 중</span>}
                {!applicable && <span className="text-[10px] text-gray-400">선택 해역 미해당</span>}
              </div>
              <span className="text-[11px] text-gray-600 font-medium tabular-nums">
                {fmtMD(item.ban.from)} ~ {fmtMD(item.ban.to)}
                {item.ban.from[0] > item.ban.to[0] ? ' (익년)' : ''}
              </span>
            </div>
            <MiniBar ban={item.ban} todayDoy={todayDoy} isNational={item.regions.includes('전국')} />
            {item.note && (
              <p className="text-[10px] text-gray-400 mt-1">{item.note}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 종 카드 ────────────────────────────────────────
function SpeciesCard({ sp, area, todayDoy }: { sp: SpeciesData; area: SeaArea; todayDoy: number }) {
  const [open, setOpen] = useState(false);
  const { status }      = getStatusInfo(sp.bans, area, todayDoy);
  const hasRegional     = sp.bans.length > 1;

  const cardBg =
    status === 'banned' || status === 'ending-soon' ? 'bg-red-50'
    : status === 'starting-soon'                    ? 'bg-amber-50/60'
    : 'bg-white';

  return (
    <div className={`${cardBg} border-b cursor-pointer`} onClick={() => setOpen(v => !v)}>
      <div className="px-4 pt-3 pb-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none flex-shrink-0">{sp.emoji}</span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-800">{sp.name}</span>
              {sp.sub && <span className="text-xs text-gray-400 ml-1">({sp.sub})</span>}
              {hasRegional && (
                <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium align-middle">
                  지역별 상이
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <StatusBadge bans={sp.bans} area={area} todayDoy={todayDoy} />
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* 타임라인 */}
        <TimelineBar bans={sp.bans} area={area} todayDoy={todayDoy} />

        {/* 항상 표시: 연중금지 경고 */}
        {sp.extraBan && (
          <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200">
            <span className="text-[10px] font-bold text-red-500 flex-shrink-0">⚠</span>
            <span className="text-[11px] text-red-700 font-medium">{sp.extraBan}</span>
          </div>
        )}

        {/* 펼침 상세 */}
        {open && (
          <div className="mt-3 space-y-2">
            {/* 지역별 금어기 테이블 */}
            {sp.bans.length > 0 ? (
              <RegionalTable bans={sp.bans} area={area} todayDoy={todayDoy} />
            ) : (
              <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">법정 금어기 없음</p>
            )}

            {/* 비고 */}
            {sp.notes && sp.notes.length > 0 && (
              <div className="pt-2 space-y-1.5">
                {sp.notes.map((n, i) => <InfoRow key={i} color="gray" label="비고" value={n} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ color, label, value }: { color: 'red'|'blue'|'gray'; label: string; value: string }) {
  const cls = color === 'red'  ? 'bg-red-100 text-red-700'
            : color === 'blue' ? 'bg-blue-100 text-blue-700'
            :                    'bg-gray-100 text-gray-500';
  return (
    <div className="flex items-start gap-2">
      <span className={`text-[10px] ${cls} rounded px-1.5 py-0.5 font-medium flex-shrink-0 leading-4`}>{label}</span>
      <span className="text-xs text-gray-700 leading-4">{value}</span>
    </div>
  );
}

// ── 해역 선택기 ────────────────────────────────────
const SEA_AREAS: SeaArea[] = ['전국', '서해', '남해', '동해', '제주'];
const SEA_ICONS: Record<SeaArea, string> = {
  '전국': '🇰🇷', '서해': '🌊', '남해': '🌊', '동해': '🌊', '제주': '🍊',
};

// ── 어종 상세 (어종별 탭) ──────────────────────────
const DETAIL_MAX_CM = 35;

function SpeciesDetail({ sp, todayDoy }: { sp: SpeciesData; todayDoy: number }) {
  const [area, setArea] = useState<SeaArea>('전국');
  const { status, daysLeft, daysUntil } = getStatusInfo(sp.bans, area, todayDoy);

  const parsed      = sp.minSize ? parseSize(sp.minSize) : null;
  const measureType = sp.minSize ? getMeasureType(sp.minSize) : '';
  const isCm        = parsed?.unit === 'cm';
  const isG         = parsed?.unit === 'g';
  const sizePct     = isCm ? Math.min((parsed!.value / DETAIL_MAX_CM) * 100, 100) : 0;

  const banCardCls =
    status === 'banned' || status === 'ending-soon' ? 'bg-red-50 border-red-200'
    : status === 'starting-soon'                    ? 'bg-amber-50 border-amber-200'
    : status === 'normal'                           ? 'bg-green-50 border-green-200'
    :                                                  'bg-gray-50 border-gray-200';

  const banStatusText =
    status === 'banned'        ? `금어기 중 · ${daysLeft}일 후 종료`
    : status === 'ending-soon'   ? `D-${daysLeft} · 종료 임박`
    : status === 'starting-soon' ? `D-${daysUntil} · 시작 임박`
    : status === 'normal'        ? '포획 가능 기간'
    : status === 'no-ban'        ? '금어기 없음'
    :                              '선택 해역에 해당 없음';

  const banStatusCls =
    status === 'banned' || status === 'ending-soon' ? 'text-red-600'
    : status === 'starting-soon'                    ? 'text-amber-700'
    : status === 'normal'                           ? 'text-green-700'
    :                                                  'text-gray-400';

  return (
    <div className="p-4 space-y-3">

      {/* 금어기 카드 */}
      <div className={`rounded-2xl border p-4 ${banCardCls}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-700">🚫 금어기</span>
          <StatusBadge bans={sp.bans} area={area} todayDoy={todayDoy} />
        </div>

        {/* 해역 선택 */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-3 pb-0.5">
          {SEA_AREAS.map(a => (
            <button key={a} onClick={() => setArea(a)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors border
                ${area === a
                  ? 'bg-ocean-dark text-white border-ocean-dark'
                  : 'bg-white/70 text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              <span>{SEA_ICONS[a]}</span><span>{a}</span>
            </button>
          ))}
        </div>

        {sp.bans.length > 0 ? (
          <>
            <TimelineBar bans={sp.bans} area={area} todayDoy={todayDoy} />
            <p className={`text-center text-sm font-bold mt-2 ${banStatusCls}`}>{banStatusText}</p>
            <RegionalTable bans={sp.bans} area={area} todayDoy={todayDoy} />
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">법정 금어기 없음</p>
        )}

        {sp.extraBan && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100 border border-red-200">
            <span className="text-red-500 font-bold text-sm flex-shrink-0">⚠</span>
            <span className="text-xs text-red-700 font-medium">{sp.extraBan}</span>
          </div>
        )}
      </div>

      {/* 금지체장 카드 */}
      <div className={`rounded-2xl border p-4 ${sp.minSize ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <span className="text-sm font-bold text-gray-700 block mb-3">📏 금지체장</span>
        {sp.minSize ? (
          <>
            <div className="mb-3">
              <p className="text-2xl font-bold text-blue-600 tabular-nums">{sp.minSize}</p>
              <p className="text-[11px] text-blue-400 mt-0.5">미만 포획금지</p>
              {measureType && (
                <p className="text-[10px] text-gray-400 mt-1">{MEASURE_LABEL[measureType]}</p>
              )}
            </div>
            {isCm && (
              <div>
                <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                  <span>0cm</span>
                  <span className="font-medium text-blue-500">{parsed!.value}cm</span>
                  <span>{DETAIL_MAX_CM}cm</span>
                </div>
                <div className="relative h-5 bg-white/80 rounded-full overflow-hidden border border-blue-100">
                  <div className="absolute top-0 left-0 h-full bg-blue-400 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${sizePct}%` }}>
                    {sizePct > 22 && <span className="text-[9px] text-white font-bold">&lt;{parsed!.value}cm</span>}
                  </div>
                  <div className="absolute top-0 h-full bg-green-100" style={{ left: `${sizePct}%`, right: 0 }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10" style={{ left: `${sizePct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] mt-1.5 font-medium">
                  <span className="text-blue-500">포획 금지</span>
                  <span className="text-green-600">포획 가능</span>
                </div>
              </div>
            )}
            {isG && (
              <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 mt-1">
                <span className="text-lg">⚖️</span>
                <p className="text-xs text-blue-700 font-medium">{parsed!.value}g 미만 포획금지 (무게 기준)</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">체장 제한 규정 없음</p>
        )}
      </div>

      {/* 비고 */}
      {sp.notes && sp.notes.length > 0 && (
        <div className="space-y-1.5">
          {sp.notes.map((n, i) => <InfoRow key={i} color="gray" label="비고" value={n} />)}
        </div>
      )}
    </div>
  );
}

function SpeciesLookupView({ todayDoy }: { todayDoy: number }) {
  const [query,      setQuery]      = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const results = SPECIES.filter(s =>
    s.name.includes(query) || (s.sub ?? '').includes(query)
  );

  const selected = selectedId ? SPECIES.find(s => s.id === selectedId) ?? null : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* 검색 + 어종 칩 */}
      <div className="bg-white border-b flex-shrink-0 px-4 pt-3 pb-2">
        {/* 검색창 */}
        <div className="relative mb-2.5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedId(null); }}
            placeholder="어종 검색 (예: 꽃게, 전복...)"
            className="w-full pl-9 pr-9 py-2.5 bg-gray-100 rounded-xl text-sm placeholder-gray-400 outline-none focus:ring-2 focus:ring-ocean-dark/20"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSelectedId(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* 어종 칩 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          {results.map(sp => (
            <button key={sp.id}
              onClick={() => setSelectedId(prev => prev === sp.id ? null : sp.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border
                ${selectedId === sp.id
                  ? 'bg-ocean-dark text-white border-ocean-dark shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'}`}
            >
              <span>{sp.emoji}</span><span>{sp.name}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-xs text-gray-400 py-1.5">검색 결과 없음</p>
          )}
        </div>
      </div>

      {/* 상세 or 안내 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {selected ? (
          <>
            {/* 선택 종 헤더 */}
            <div className="px-4 py-3 bg-white border-b flex items-center gap-3">
              <span className="text-3xl leading-none">{selected.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-800">{selected.name}</span>
                  {selected.sub && <span className="text-sm text-gray-400">({selected.sub})</span>}
                </div>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{selected.category}</span>
              </div>
            </div>
            <SpeciesDetail sp={selected} todayDoy={todayDoy} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-8 py-12">
            <span className="text-5xl opacity-20">🔍</span>
            <p className="text-sm text-center leading-relaxed">
              위에서 어종을 선택하거나<br/>이름으로 검색해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 필터 카테고리 ──────────────────────────────────
type FilterCat = '전체' | Category;
const FILTER_TABS: FilterCat[] = ['전체', '어류', '갑각류', '연체류', '패류'];

// ── 메인 컴포넌트 ──────────────────────────────────
type ViewMode = '금어기' | '금지체장' | '어종별';

export default function FishingBan() {
  const [viewMode, setViewMode] = useState<ViewMode>('금어기');
  const [seaArea, setSeaArea]   = useState<SeaArea>('전국');
  const [filter,  setFilter]    = useState<FilterCat>('전체');

  const today    = new Date();
  const todayDoy = useMemo(() => doy(today.getMonth() + 1, today.getDate()), []);
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const filtered = useMemo(() => {
    const list = filter === '전체' ? SPECIES : SPECIES.filter(s => s.category === filter);
    return [...list].sort((a, b) =>
      STATUS_ORDER[getStatusInfo(a.bans, seaArea, todayDoy).status] -
      STATUS_ORDER[getStatusInfo(b.bans, seaArea, todayDoy).status]
    );
  }, [filter, seaArea, todayDoy]);

  const currentlyBanned = useMemo(() =>
    SPECIES.filter(s => {
      const { status } = getStatusInfo(s.bans, seaArea, todayDoy);
      return status === 'banned' || status === 'ending-soon';
    }), [seaArea, todayDoy]);

  const comingSoon = useMemo(() =>
    SPECIES.filter(s => getStatusInfo(s.bans, seaArea, todayDoy).status === 'starting-soon'),
    [seaArea, todayDoy]);

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="flex items-baseline justify-between px-4 pt-3 pb-1">
          <h2 className="text-base font-bold text-gray-800">금지 정보</h2>
          <span className="text-xs text-gray-400">{todayStr}</span>
        </div>
        <p className="text-[11px] text-gray-400 px-4 pb-2">수산자원관리법 2025년 기준 · 해양수산부</p>

        {/* 뷰 모드 토글 */}
        <div className="px-4 pb-2.5">
          <div className="flex bg-gray-100 rounded-xl p-0.5">
            {(['금어기', '금지체장', '어종별'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-[10px] transition-all
                  ${viewMode === mode
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'}`}
              >
                {mode === '금어기' ? '🚫 금어기' : mode === '금지체장' ? '📏 금지체장' : '🔍 어종별'}
              </button>
            ))}
          </div>
        </div>

        {/* 해역 선택 (금어기 모드만) */}
        {viewMode === '금어기' && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {SEA_AREAS.map(area => (
              <button
                key={area}
                onClick={() => setSeaArea(area)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors border
                  ${seaArea === area
                    ? 'bg-ocean-dark text-white border-ocean-dark'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                <span>{SEA_ICONS[area]}</span>
                <span>{area}</span>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 현재 금어기 배너 (금어기 모드만) */}
        {viewMode === '금어기' && currentlyBanned.length > 0 && (
          <div className="mx-4 mb-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
            <p className="text-xs font-bold text-red-600 mb-1.5">
              🚫 현재 금어기 {currentlyBanned.length}종
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currentlyBanned.map(s => {
                const { status, daysLeft } = getStatusInfo(s.bans, seaArea, todayDoy);
                return (
                  <span key={s.id}
                    className={`text-[11px] px-2.5 py-1 rounded-full font-medium
                      ${status === 'ending-soon' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {s.emoji} {s.name}
                    {status === 'ending-soon' && <span className="ml-1 opacity-70 text-[10px]">D-{daysLeft}</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 임박 배너 (금어기 모드만) */}
        {viewMode === '금어기' && comingSoon.length > 0 && (
          <div className="mx-4 mb-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <p className="text-xs font-bold text-amber-700 mb-1.5">⚠️ 금어기 임박 {comingSoon.length}종</p>
            <div className="flex flex-wrap gap-1.5">
              {comingSoon.map(s => {
                const { daysUntil } = getStatusInfo(s.bans, seaArea, todayDoy);
                return (
                  <span key={s.id} className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800">
                    {s.emoji} {s.name}
                    <span className="ml-1 opacity-70 text-[10px]">D-{daysUntil}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 범례 (금어기 모드만) */}
        {viewMode === '금어기' && (
          <div className="flex items-center gap-3 px-4 pb-1.5">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="inline-block w-3 h-1.5 rounded-full bg-red-300"/>전국 금어기
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="inline-block w-3 h-1.5 rounded-full bg-red-500"/>지역별 금어기
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="inline-block w-px h-3 bg-blue-500"/>오늘
            </span>
          </div>
        )}

        {/* 카테고리 필터 (어종별 탭 제외) */}
        {viewMode !== '어종별' && (
          <div className="flex border-t">
            {FILTER_TABS.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors
                  ${filter === cat ? 'text-ocean-dark border-b-2 border-ocean-dark' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 금어기 목록 */}
      {viewMode === '금어기' && (
        <div className="flex-1 overflow-y-auto">
          {filtered.map(sp => (
            <SpeciesCard key={sp.id} sp={sp} area={seaArea} todayDoy={todayDoy} />
          ))}
          <p className="py-4 text-center text-[10px] text-gray-300 px-6">
            수산자원관리법 시행령 별표 기준 · 지역별 별도 규정 있을 수 있음 · 정확한 내용은 해양수산부 공고 확인
          </p>
        </div>
      )}

      {/* 금지체장 목록 */}
      {viewMode === '금지체장' && <MinSizeView filter={filter} />}

      {/* 어종별 조회 */}
      {viewMode === '어종별' && <SpeciesLookupView todayDoy={todayDoy} />}
    </div>
  );
}

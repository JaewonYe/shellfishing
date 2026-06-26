'use client';

import { FarmProperties } from './KakaoMap';

interface FarmInfoContentProps {
  farm: FarmProperties;
  onClose: () => void;
}

function formatArea(area: number | null): string {
  if (area == null) return '-';
  if (area >= 100) return `${area.toLocaleString()} ha`;
  return `${area.toFixed(2)} ha`;
}

function val(v: string | number | null | undefined): string {
  if (v == null || v === '' || v === '-') return '-';
  return String(v);
}

interface InfoRowProps {
  label: string;
  value: string;
  wide?: boolean;
}

function InfoRow({ label, value, wide }: InfoRowProps) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5 break-keep">{value}</p>
    </div>
  );
}

/** 양식 어장 정보 패널의 내용. BottomSheet 안에서 렌더링된다. */
export default function FarmInfoContent({ farm: f, onClose }: FarmInfoContentProps) {
  const title = [val(f.sgg), val(f.name)].filter(s => s !== '-').join(' ') || val(f.address);
  const typeLabel = f.kind && f.kind !== f.type
    ? `${val(f.type)} · ${val(f.kind)}`
    : val(f.type);
  const navigateUrl = f.lat && f.lng
    ? `https://map.kakao.com/link/to/${encodeURIComponent(title)},${f.lat},${f.lng}`
    : null;

  return (
    <div className="px-5 pb-5 pt-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <h2 className="text-lg font-bold text-ocean-dark leading-snug flex-1">{title}</h2>
        <button
          onClick={() => { console.log('[DEBUG] FarmInfoContent × button clicked'); onClose(); }}
          className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg leading-none flex-shrink-0 active:opacity-70"
          aria-label="닫기"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoRow label="어업 구분" value={typeLabel} />
        <InfoRow label="관련 부서" value={val(f.org)} />
        <InfoRow label="어장 면적" value={formatArea(f.area)} />
        <InfoRow label="주요 어종" value={val(f.species)} wide />
        <InfoRow label="허가 번호" value={val(f.lcns_no)} />
        <InfoRow label="허가 기간" value={val(f.period)} wide />
        <InfoRow label="소재지"   value={val(f.address)} wide />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { console.log('[DEBUG] FarmInfoContent 닫기 button clicked'); onClose(); }}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm active:opacity-75"
        >
          닫기
        </button>
        {navigateUrl ? (
          <a
            href={navigateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm text-center active:opacity-75"
          >
            길 찾기
          </a>
        ) : (
          <button
            disabled
            className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-400 font-semibold text-sm"
          >
            길 찾기
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

interface HeaderProps {
  activeTab?: 'map' | 'calendar' | 'ban';
  onLocationClick: () => void;
  onRefreshClick: () => void;
  tideVisible: boolean;
  onTideToggle: () => void;
  showVillage: boolean;
  onVillageToggle: () => void;
  showAqua: boolean;
  onAquaToggle: () => void;
  showSetnet: boolean;
  onSetnetToggle: () => void;
}

const LAYERS = [
  { label: '마을어업',  key: 'village' as const },
  { label: '양식어업',  key: 'aqua'    as const },
  { label: '정치망어업', key: 'setnet'  as const },
];

export default function Header({
  activeTab = 'map',
  onLocationClick, onRefreshClick,
  tideVisible, onTideToggle,
  showVillage, onVillageToggle,
  showAqua, onAquaToggle,
  showSetnet, onSetnetToggle,
}: HeaderProps) {
  const [layerOpen, setLayerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layerOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setLayerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [layerOpen]);

  const checked  = { village: showVillage, aqua: showAqua, setnet: showSetnet } as const;
  const onToggle = { village: onVillageToggle, aqua: onAquaToggle, setnet: onSetnetToggle } as const;
  const hiddenCnt = (!showVillage ? 1 : 0) + (!showAqua ? 1 : 0) + (!showSetnet ? 1 : 0);

  return (
    <header className="relative flex items-center justify-between h-14 px-4 bg-ocean-dark text-white flex-shrink-0 z-40">
      <div className="flex items-center gap-2">
        <span className="text-2xl leading-none">🦪</span>
        <h1 className="text-lg font-bold tracking-tight">해루질 맵</h1>
      </div>

      <div className="flex gap-1">

        {/* 지도 탭 전용 컨트롤 */}
        {activeTab === 'map' && <>

        {/* 레이어 선택 버튼 */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setLayerOpen(v => !v)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors
              ${layerOpen ? 'bg-white/30 ring-1 ring-white/60' : 'hover:bg-white/20 active:bg-white/30'}`}
            aria-label="어장 레이어 선택"
            title="어장 레이어"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            {hiddenCnt > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-400 text-white text-[9px] font-bold flex items-center justify-center">
                {hiddenCnt}
              </span>
            )}
          </button>

          {layerOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl w-52 p-3 z-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                어장 레이어
              </p>
              {LAYERS.map(layer => (
                <label
                  key={layer.label}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={checked[layer.key]}
                    onChange={onToggle[layer.key]}
                    className="w-4 h-4 rounded accent-ocean-mid flex-shrink-0 cursor-pointer"
                  />
                  <span
                    className="w-5 h-3.5 rounded flex-shrink-0 border-2"
                    style={{ borderColor: '#1565c0', background: '#4fc3f755' }}
                  />
                  <span className="text-sm text-gray-800 font-medium">{layer.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 물때 관측소 */}
        <button
          onClick={onTideToggle}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors
            ${tideVisible ? 'bg-white/30 ring-1 ring-white/60' : 'hover:bg-white/20 active:bg-white/30'}`}
          aria-label="물때 관측소 표시"
          title="물때 관측소"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
            <path d="M2 17c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
            <path d="M2 7c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
          </svg>
        </button>

        {/* 내 위치 */}
        <button
          onClick={onLocationClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
          aria-label="내 위치로 이동"
          title="내 위치"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </button>

        {/* 새로고침 */}
        <button
          onClick={onRefreshClick}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-colors"
          aria-label="새로고침"
          title="어장 정보 새로고침"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>

        </> /* activeTab === 'map' */}

      </div>
    </header>
  );
}

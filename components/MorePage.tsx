'use client';

import { useEffect, useState } from 'react';

interface MorePageProps {
  showVillage: boolean;
  onVillageToggle: () => void;
  showAqua: boolean;
  onAquaToggle: () => void;
  showSetnet: boolean;
  onSetnetToggle: () => void;
  tideVisible: boolean;
  onTideToggle: () => void;
  cctvVisible: boolean;
  onCctvToggle: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const LAYERS = [
  { key: 'village' as const, label: '마을어업', desc: '마을 공동 어장 구역' },
  { key: 'aqua' as const, label: '양식어업', desc: '양식장 허가 구역' },
  { key: 'setnet' as const, label: '정치망어업', desc: '정치망 설치 구역' },
];

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)) {
      setIsIOS(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return { deferredPrompt, isInstalled, isIOS, install };
}

export default function MorePage({
  showVillage, onVillageToggle,
  showAqua, onAquaToggle,
  showSetnet, onSetnetToggle,
  tideVisible, onTideToggle,
  cctvVisible, onCctvToggle,
}: MorePageProps) {
  const checked = { village: showVillage, aqua: showAqua, setnet: showSetnet };
  const onToggle = { village: onVillageToggle, aqua: onAquaToggle, setnet: onSetnetToggle };
  const { deferredPrompt, isInstalled, isIOS, install } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* 앱 소개 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-10 h-10 flex-shrink-0" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#4fc3f7" opacity="0.3"/>
              <path d="M6 18c2-3 5-4 7-2s5 2 7 0 4-1 6 1" stroke="#0d47a1" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 22c2-3 5-4 7-2s5 2 7 0 4-1 6 1" stroke="#0d47a1" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
              <path d="M16 8v7M13 11l3 4 3-4" stroke="#0d47a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h2 className="text-xl font-bold text-ocean-dark">공유해</h2>
              <p className="text-xs text-gray-400">바다 레저 정보 공유 플랫폼</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            <strong className="text-ocean-dark">공유해</strong>는 해루질, 낚시 등
            바다에서 이뤄지는 레저 활동에 필요한 정보를 한곳에 모아 공유하기 위한 앱입니다.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-ocean-mid mt-0.5">&#9679;</span>
              <span>마을어장·양식어장·정치망 구역을 지도에서 확인</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ocean-mid mt-0.5">&#9679;</span>
              <span>물때(조석) 관측소 실시간 정보 조회</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ocean-mid mt-0.5">&#9679;</span>
              <span>물때 달력으로 일정 계획</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ocean-mid mt-0.5">&#9679;</span>
              <span>금어기·금지체장 정보로 안전한 채취</span>
            </li>
          </ul>
        </section>

        {/* 앱 설치 */}
        {!isInstalled && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">홈 화면에 추가</h3>
            <p className="text-sm text-gray-500 mb-4">
              홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있습니다.
            </p>

            {deferredPrompt ? (
              <button
                onClick={install}
                className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm active:opacity-75 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                홈 화면에 추가
              </button>
            ) : isIOS ? (
              <>
                <button
                  onClick={() => setShowIOSGuide(v => !v)}
                  className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm active:opacity-75 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  홈 화면 추가 방법 보기
                </button>
                {showIOSGuide && (
                  <div className="mt-3 bg-ocean-pale rounded-xl p-4 space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-mid text-white text-xs font-bold flex items-center justify-center">1</span>
                      <span>하단의 <strong>공유 버튼</strong>
                        <svg className="inline w-4 h-4 mx-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        을 탭하세요
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-mid text-white text-xs font-bold flex items-center justify-center">2</span>
                      <span>메뉴에서 <strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-mid text-white text-xs font-bold flex items-center justify-center">3</span>
                      <span>우측 상단의 <strong>&quot;추가&quot;</strong>를 탭하면 완료됩니다</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center">
                Chrome, Edge, Samsung Internet 등에서 이용 가능합니다.
              </p>
            )}
          </section>
        )}

        {/* 지도 표시 설정 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">지도 표시 설정</h3>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2">
              어장 레이어
            </p>
            {LAYERS.map(layer => (
              <label
                key={layer.key}
                className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800">{layer.label}</span>
                  <p className="text-[11px] text-gray-400 mt-0.5">{layer.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked[layer.key]}
                  onChange={onToggle[layer.key]}
                  className="w-5 h-5 rounded accent-ocean-mid cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="border-t mt-3 pt-3">
            <label className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100">
              <div>
                <span className="text-sm font-medium text-gray-800">물때 관측소</span>
                <p className="text-[11px] text-gray-400 mt-0.5">조석 관측소 마커 표시</p>
              </div>
              <input
                type="checkbox"
                checked={tideVisible}
                onChange={onTideToggle}
                className="w-5 h-5 rounded accent-ocean-mid cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100">
              <div>
                <span className="text-sm font-medium text-gray-800">교통 CCTV</span>
                <p className="text-[11px] text-gray-400 mt-0.5">도로 교통 CCTV 실시간 영상</p>
              </div>
              <input
                type="checkbox"
                checked={cctvVisible}
                onChange={onCctvToggle}
                className="w-5 h-5 rounded accent-ocean-mid cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* 버전 정보 */}
        <p className="text-center text-xs text-gray-300 pb-4">v0.1.0</p>

      </div>
    </div>
  );
}

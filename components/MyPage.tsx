'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdminPage from './AdminPage';
import FeedbackPage from './FeedbackPage';

// ── 앱 설치 프롬프트 훅 ─────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)) {
      setIsIOS(true);
    }

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    const installed = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed); };
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

interface User {
  id: number;
  nickname: string;
  profileImg: string;
  role: string;
  createdAt: string;
}

export interface Favorite {
  id: number;
  label: string;
  lat: number;
  lng: number;
  created_at: string;
}

interface MyPageProps {
  onAddFavorite?: () => void;
  onViewFavorite?: (favorite: Favorite) => void;
  showVillage?: boolean;
  onVillageToggle?: () => void;
  showAqua?: boolean;
  onAquaToggle?: () => void;
  showSetnet?: boolean;
  onSetnetToggle?: () => void;
  tideVisible?: boolean;
  onTideToggle?: () => void;
  cctvVisible?: boolean;
  onCctvToggle?: () => void;
}

const MAP_LAYERS = [
  { key: 'village' as const, label: '마을어업', desc: '마을 공동 어장 구역' },
  { key: 'aqua'    as const, label: '양식어업', desc: '양식장 허가 구역' },
  { key: 'setnet'  as const, label: '정치망어업', desc: '정치망 설치 구역' },
];

interface FavDetail {
  farm: { name: string; sgg: string; species: string; distKm: number } | null;
  tideText: string;
  weatherText: string;
  stationName: string;
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

export default function MyPage({
  onAddFavorite, onViewFavorite,
  showVillage = true, onVillageToggle,
  showAqua = true, onAquaToggle,
  showSetnet = true, onSetnetToggle,
  tideVisible = true, onTideToggle,
  cctvVisible = false, onCctvToggle,
}: MyPageProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { deferredPrompt, isInstalled, isIOS, install } = useInstallPrompt();

  const layerChecked = { village: showVillage, aqua: showAqua, setnet: showSetnet };
  const layerToggle  = { village: onVillageToggle, aqua: onAquaToggle, setnet: onSetnetToggle };
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, FavDetail | 'loading'>>({});
  const stationsRef = useRef<any[] | null>(null);

  const loadFavorites = useCallback(() => {
    setFavoritesLoading(true);
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => setFavorites(data.favorites ?? []))
      .catch(() => setFavorites([]))
      .finally(() => setFavoritesLoading(false));
  }, []);

  const loadDetail = useCallback(async (fav: Favorite) => {
    if (detailMap[fav.id]) return;
    setDetailMap(prev => ({ ...prev, [fav.id]: 'loading' }));

    try {
      if (!stationsRef.current) {
        stationsRef.current = await fetch('/api/tide-stations').then(r => r.json()).catch(() => []);
      }
      const stations: any[] = stationsRef.current ?? [];
      const nearestStation = stations
        .map(s => ({ ...s, dist: haversineKm(fav.lat, fav.lng, s.lat, s.lng) }))
        .sort((a, b) => a.dist - b.dist)[0] ?? null;

      const [farmRes, detailRes] = await Promise.all([
        fetch(`/api/nearest-farm?lat=${fav.lat}&lng=${fav.lng}`).then(r => r.json()).catch(() => ({ farm: null })),
        nearestStation
          ? fetch(`/api/tide-detail?code=${nearestStation.code}&lat=${fav.lat}&lng=${fav.lng}`).then(r => r.json()).catch(() => null)
          : Promise.resolve(null),
      ]);

      const today = detailRes?.weekly?.[0];
      let tideText = '물때 정보 없음';
      if (today?.extrema?.length) {
        const label = (t: string) => (t === 'high' ? '만조' : '간조');
        tideText =
          (today.tideName ? today.tideName + ' · ' : '') +
          today.extrema.map((e: any) => `${label(e.type)} ${e.time} (${e.height}cm)`).join(' / ');
      }

      const nowHour = new Date().getHours();
      const slots: any[] = detailRes?.weather?.[0] ?? [];
      const slot = slots.reduce((best: any, s: any) =>
        !best || Math.abs(s.hour - nowHour) < Math.abs(best.hour - nowHour) ? s : best, null);
      const weatherText = slot
        ? [
            slot.weatherLabel ? `${slot.weatherIcon} ${slot.weatherLabel}` : null,
            slot.airTemp != null ? `기온 ${slot.airTemp}°C` : null,
            slot.seaTemp != null ? `수온 ${slot.seaTemp}°C` : null,
            slot.waveHeight != null ? `파고 ${slot.waveHeight}m` : null,
            slot.windSpeed != null ? `풍속 ${slot.windSpeed}km/h` : null,
          ].filter(Boolean).join(' · ')
        : '날씨 정보 없음';

      setDetailMap(prev => ({
        ...prev,
        [fav.id]: {
          farm: farmRes.farm ?? null,
          tideText,
          weatherText,
          stationName: nearestStation?.name ?? '',
        },
      }));
    } catch {
      setDetailMap(prev => ({
        ...prev,
        [fav.id]: { farm: null, tideText: '정보를 불러올 수 없습니다.', weatherText: '', stationName: '' },
      }));
    }
  }, [detailMap]);

  const handleToggle = useCallback((fav: Favorite) => {
    setExpandedId(prev => {
      const next = prev === fav.id ? null : fav.id;
      if (next !== null) loadDetail(fav);
      return next;
    });
  }, [loadDetail]);

  useEffect(() => {
    let retries = 0;
    const fetchUser = () => {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(data => {
          const u = data.user ?? null;
          setUser(u);
          if (u && !u.role && retries < 2) {
            retries++;
            setTimeout(fetchUser, 1000);
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (retries < 2) {
            retries++;
            setTimeout(fetchUser, 1000);
          } else {
            setUser(null);
            setLoading(false);
          }
        });
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user, loadFavorites]);

  const handleDeleteFavorite = useCallback(async (id: number) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const handleLogin = useCallback(() => {
    window.location.href = '/api/auth/kakao';
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (showAdmin && user?.role === 'admin') {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  if (showFeedback) {
    return <FeedbackPage onBack={() => setShowFeedback(false)} />;
  }

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {user ? (
          <>
            {/* 프로필 */}
            <section className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                {user.profileImg ? (
                  <img
                    src={user.profileImg}
                    alt="프로필"
                    className="w-14 h-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-ocean-pale flex items-center justify-center">
                    <svg className="w-7 h-7 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800">{user.nickname || '사용자'}</h2>
                    {user.role === 'admin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">관리자</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </section>

            {/* 관리자 메뉴 */}
            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(true)}
                className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm active:opacity-75 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                관리자 페이지
              </button>
            )}

            {/* 개선 요청 */}
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm active:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="13" x2="13" y2="13"/>
              </svg>
              개선 요청
            </button>

            {/* 관심 지역 */}
            <section className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">관심 지역</h3>
                <button
                  onClick={onAddFavorite}
                  className="text-xs font-semibold text-ocean-mid active:opacity-60 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  지도에서 추가
                </button>
              </div>

              {favoritesLoading ? (
                <p className="text-sm text-gray-400">불러오는 중...</p>
              ) : favorites.length === 0 ? (
                <p className="text-sm text-gray-400">
                  등록된 관심 지역이 없습니다. 지도에서 위치를 선택해 등록해보세요.
                </p>
              ) : (
                <ul className="space-y-2">
                  {favorites.map(fav => {
                    const isOpen = expandedId === fav.id;
                    const detail = detailMap[fav.id];
                    return (
                      <li key={fav.id} className="rounded-xl bg-gray-50 overflow-hidden">
                        {/* 헤더 행 */}
                        <div className="flex items-center gap-1 px-3 py-2.5">
                          <button
                            onClick={() => handleToggle(fav)}
                            className="flex-1 text-left flex items-center gap-2 min-w-0"
                          >
                            <svg className="w-4 h-4 text-ocean-mid shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span className="text-sm font-medium text-gray-700 truncate">{fav.label}</span>
                            <svg
                              className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            >
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>

                          {/* 지도 이동 버튼 */}
                          <button
                            onClick={() => onViewFavorite?.(fav)}
                            className="shrink-0 p-1.5 rounded-lg text-ocean-mid active:bg-ocean-pale"
                            aria-label="지도에서 보기"
                            title="지도에서 보기"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                              <line x1="9" y1="3" x2="9" y2="18"/>
                              <line x1="15" y1="6" x2="15" y2="21"/>
                            </svg>
                          </button>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeleteFavorite(fav.id)}
                            className="shrink-0 p-1.5 rounded-lg text-gray-300 active:text-red-500"
                            aria-label="삭제"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l12 12M18 6l-12 12"/>
                            </svg>
                          </button>
                        </div>

                        {/* 상세 정보 패널 */}
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                            {detail === 'loading' || !detail ? (
                              <p className="text-xs text-gray-400 py-2">불러오는 중...</p>
                            ) : (
                              <>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">가까운 마을어장</p>
                                  {detail.farm ? (
                                    <p className="text-xs text-gray-700">
                                      {detail.farm.name} ({detail.farm.sgg}) · {detail.farm.distKm}km
                                      {detail.farm.species && detail.farm.species !== '-' ? ` · ${detail.farm.species}` : ''}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-400">주변 마을어장 정보 없음</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">
                                    물때{detail.stationName ? ` (${detail.stationName})` : ''}
                                  </p>
                                  <p className="text-xs text-gray-700">{detail.tideText}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-400 mb-0.5">현재 날씨 · 파고 · 수온</p>
                                  <p className="text-xs text-gray-700">{detail.weatherText || '정보 없음'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm active:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>

            {/* 지도 표시 설정 */}
            {MapSettingsSection({ layerChecked, layerToggle, tideVisible, onTideToggle, cctvVisible, onCctvToggle })}

            {/* 앱 설치 / 소개 */}
            {AppInfoSection({ isInstalled, deferredPrompt, isIOS, install, showIOSGuide, setShowIOSGuide })}
          </>
        ) : (
          <>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm active:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="13" y2="13"/>
            </svg>
            개선 요청
          </button>
          <section className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ocean-pale flex items-center justify-center">
              <svg className="w-8 h-8 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-400 mb-5">
              로그인하면 내 활동을 관리할 수 있습니다.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl font-semibold text-sm active:opacity-75 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.76 5.01 4.4 6.35l-.95 3.52c-.06.22.2.4.38.27l4.17-2.74c.65.08 1.31.1 1.99.1 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
              카카오 로그인
            </button>
          </section>

          {/* 지도 표시 설정 */}
          {MapSettingsSection({ layerChecked, layerToggle, tideVisible, onTideToggle, cctvVisible, onCctvToggle })}

          {/* 앱 설치 / 소개 */}
          {AppInfoSection({ isInstalled, deferredPrompt, isIOS, install, showIOSGuide, setShowIOSGuide })}
          </>
        )}

        {/* 버전 정보 */}
        <p className="text-center text-xs text-gray-300 pb-2">v0.1.0</p>

      </div>
    </div>
  );
}

// ── 지도 표시 설정 섹션 ──────────────────────────────
function MapSettingsSection({
  layerChecked, layerToggle, tideVisible, onTideToggle, cctvVisible, onCctvToggle,
}: {
  layerChecked: Record<string, boolean>;
  layerToggle: Record<string, (() => void) | undefined>;
  tideVisible: boolean;
  onTideToggle?: () => void;
  cctvVisible: boolean;
  onCctvToggle?: () => void;
}) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-4">지도 표시 설정</h3>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2">
          어장 레이어
        </p>
        {MAP_LAYERS.map(layer => (
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
              checked={layerChecked[layer.key]}
              onChange={layerToggle[layer.key]}
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
          <input type="checkbox" checked={tideVisible} onChange={onTideToggle} className="w-5 h-5 rounded accent-ocean-mid cursor-pointer" />
        </label>
        <label className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100">
          <div>
            <span className="text-sm font-medium text-gray-800">교통 CCTV</span>
            <p className="text-[11px] text-gray-400 mt-0.5">도로 교통 CCTV 실시간 영상</p>
          </div>
          <input type="checkbox" checked={cctvVisible} onChange={onCctvToggle} className="w-5 h-5 rounded accent-ocean-mid cursor-pointer" />
        </label>
      </div>
    </section>
  );
}

// ── 앱 소개 + 설치 섹션 ──────────────────────────────
function AppInfoSection({
  isInstalled, deferredPrompt, isIOS, install, showIOSGuide, setShowIOSGuide,
}: {
  isInstalled: boolean;
  deferredPrompt: any;
  isIOS: boolean;
  install: () => void;
  showIOSGuide: boolean;
  setShowIOSGuide: (v: boolean) => void;
}) {
  return (
    <>
      {!isInstalled && (
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">홈 화면에 추가</h3>
          <p className="text-sm text-gray-500 mb-4">홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있습니다.</p>
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
                onClick={() => setShowIOSGuide(!showIOSGuide)}
                className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm active:opacity-75 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                홈 화면 추가 방법 보기
              </button>
              {showIOSGuide && (
                <div className="mt-3 bg-ocean-pale rounded-xl p-4 space-y-3 text-sm text-gray-700">
                  {[
                    <>하단의 <strong>공유 버튼</strong> <svg className="inline w-4 h-4 mx-1 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>을 탭하세요</>,
                    <>메뉴에서 <strong>&quot;홈 화면에 추가&quot;</strong>를 선택하세요</>,
                    <>우측 상단의 <strong>&quot;추가&quot;</strong>를 탭하면 완료됩니다</>,
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ocean-mid text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center">Chrome, Edge, Samsung Internet 등에서 이용 가능합니다.</p>
          )}
        </section>
      )}

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
          {[
            '마을어장·양식어장·정치망 구역을 지도에서 확인',
            '물때(조석) 관측소 실시간 정보 조회',
            '물때 달력으로 일정 계획',
            '금어기·금지체장 정보로 안전한 채취',
          ].map(text => (
            <li key={text} className="flex items-start gap-2">
              <span className="text-ocean-mid mt-0.5">&#9679;</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

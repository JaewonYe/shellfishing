'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface Favorite {
  id: number;
  label: string;
  lat: number;
  lng: number;
  created_at: string;
}

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

interface FavoritesPageProps {
  onAddFavorite?: () => void;
  onViewFavorite?: (favorite: Favorite) => void;
}

export default function FavoritesPage({ onAddFavorite, onViewFavorite }: FavoritesPageProps = {}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailMap, setDetailMap] = useState<Record<number, FavDetail | 'loading'>>({});
  const stationsRef = useRef<any[] | null>(null);

  useEffect(() => {
    fetch('/api/favorites')
      .then(r => {
        if (r.status === 401) { setLoggedIn(false); return null; }
        setLoggedIn(true);
        return r.json();
      })
      .then(data => { if (data) setFavorites(data.favorites ?? []); })
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
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
        const lbl = (t: string) => (t === 'high' ? '만조' : '간조');
        tideText =
          (today.tideName ? today.tideName + ' · ' : '') +
          today.extrema.map((e: any) => `${lbl(e.type)} ${e.time} (${e.height}cm)`).join(' / ');
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
        [fav.id]: { farm: farmRes.farm ?? null, tideText, weatherText, stationName: nearestStation?.name ?? '' },
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

  const handleDelete = useCallback(async (id: number) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (loggedIn === false) {
    return (
      <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ocean-pale flex items-center justify-center">
              <svg className="w-8 h-8 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-400 mb-5">로그인하면 관심 지역을 등록하고 조회할 수 있습니다.</p>
            <button
              onClick={() => { window.location.href = '/api/auth/kakao'; }}
              className="w-full py-3 rounded-xl font-semibold text-sm active:opacity-75 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.76 5.01 4.4 6.35l-.95 3.52c-.06.22.2.4.38.27l4.17-2.74c.65.08 1.31.1 1.99.1 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
              카카오 로그인
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">관심 지역</h2>
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

        {favorites.length === 0 ? (
          <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-ocean-pale flex items-center justify-center">
              <svg className="w-7 h-7 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">등록된 관심 지역이 없습니다.</p>
            <p className="text-xs text-gray-400">지도에서 위치를 선택해 등록해보세요.</p>
          </section>
        ) : (
          <ul className="space-y-2">
            {favorites.map(fav => {
              const isOpen = expandedId === fav.id;
              const detail = detailMap[fav.id];
              return (
                <li key={fav.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-1 px-4 py-3">
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

                    <button
                      onClick={() => handleDelete(fav.id)}
                      className="shrink-0 p-1.5 rounded-lg text-gray-300 active:text-red-500"
                      aria-label="삭제"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l12 12M18 6l-12 12"/>
                      </svg>
                    </button>
                  </div>

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

      </div>
    </div>
  );
}

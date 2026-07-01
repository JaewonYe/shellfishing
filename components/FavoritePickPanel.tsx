'use client';

import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';

interface FavoritePickPanelProps {
  location: { lat: number; lng: number } | null;
  onClose: () => void;
  onSaved: () => void;
}

interface TideStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  sea: string;
}

interface NearestFarm {
  name: string;
  sgg: string;
  address: string;
  species: string;
  distKm: number;
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

export default function FavoritePickPanel({ location, onClose, onSaved }: FavoritePickPanelProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [farm, setFarm] = useState<NearestFarm | null>(null);
  const [station, setStation] = useState<TideStation | null>(null);
  const [tideText, setTideText] = useState<string>('');
  const [weatherText, setWeatherText] = useState<string>('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location) {
      setDisplay(location);
      setLabel('');
      setError('');
      requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(false);
    }
  }, [location]);

  useEffect(() => {
    if (!display) return;
    let cancelled = false;
    setLoading(true);
    setFarm(null);
    setStation(null);
    setTideText('');
    setWeatherText('');

    (async () => {
      try {
        const farmPromise = fetch(`/api/nearest-farm?lat=${display.lat}&lng=${display.lng}`)
          .then(r => r.json()).then(d => d.farm as NearestFarm | null).catch(() => null);

        const stationsPromise = fetch('/api/tide-stations')
          .then(r => r.json()).catch(() => [] as TideStation[]);

        const [farmResult, stations] = await Promise.all([farmPromise, stationsPromise]);
        if (cancelled) return;
        setFarm(farmResult);

        const nearestStation = (stations as TideStation[])
          .map(s => ({ ...s, dist: haversineKm(display.lat, display.lng, s.lat, s.lng) }))
          .sort((a, b) => a.dist - b.dist)[0] ?? null;
        setStation(nearestStation);

        if (nearestStation) {
          const detail = await fetch(
            `/api/tide-detail?code=${nearestStation.code}&lat=${display.lat}&lng=${display.lng}`
          ).then(r => r.json()).catch(() => null);

          if (cancelled) return;

          const today = detail?.weekly?.[0];
          if (today?.extrema?.length) {
            const label2 = (t: string) => (t === 'high' ? '만조' : '간조');
            setTideText(
              `${today.tideName ? today.tideName + ' · ' : ''}` +
              today.extrema.map((e: any) => `${label2(e.type)} ${e.time} (${e.height}cm)`).join(' / ')
            );
          } else {
            setTideText('물때 정보 없음');
          }

          const nowHour = new Date().getHours();
          const slots: any[] = detail?.weather?.[0] ?? [];
          const slot = slots.reduce((best: any, s: any) =>
            (best == null || Math.abs(s.hour - nowHour) < Math.abs(best.hour - nowHour)) ? s : best, null);
          if (slot) {
            const parts = [
              slot.weatherLabel ? `${slot.weatherIcon} ${slot.weatherLabel}` : null,
              slot.airTemp != null ? `기온 ${slot.airTemp}°C` : null,
              slot.seaTemp != null ? `수온 ${slot.seaTemp}°C` : null,
              slot.waveHeight != null ? `파고 ${slot.waveHeight}m` : null,
              slot.windSpeed != null ? `풍속 ${slot.windSpeed}km/h` : null,
            ].filter(Boolean);
            setWeatherText(parts.join(' · '));
          } else {
            setWeatherText('날씨 정보 없음');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [display]);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleTransitionEnd = () => {
    if (!open) setDisplay(null);
  };

  const handleSave = async () => {
    if (!display) return;
    const trimmed = label.trim();
    if (!trimmed) {
      setError('지역 이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed, lat: display.lat, lng: display.lng }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error === 'limit-exceeded' ? '관심 지역은 최대 30개까지 등록할 수 있습니다.' : '저장에 실패했습니다.');
        return;
      }
      handleClose();
      onSaved();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!display) return null;

  return (
    <BottomSheet open={open} onClose={handleClose} onTransitionEnd={handleTransitionEnd}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">관심 지역 등록</h3>
          <button onClick={handleClose} className="text-gray-400 active:text-gray-600" aria-label="닫기">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12"/>
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="지역 이름 (예: 우리집 갯바위)"
          maxLength={50}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-ocean-mid"
        />

        {loading ? (
          <p className="text-sm text-gray-400 py-4 text-center">정보를 불러오는 중...</p>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">가까운 마을어장</p>
              {farm ? (
                <p className="text-gray-700">
                  {farm.name} ({farm.sgg}) · {farm.distKm}km
                  {farm.species && farm.species !== '-' ? ` · ${farm.species}` : ''}
                </p>
              ) : (
                <p className="text-gray-400">주변 마을어장 정보 없음</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">
                물때{station ? ` (${station.name})` : ''}
              </p>
              <p className="text-gray-700">{tideText || '정보 없음'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">현재 날씨 · 파고 · 수온</p>
              <p className="text-gray-700">{weatherText || '정보 없음'}</p>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm active:opacity-75 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '관심 지역으로 저장'}
        </button>
      </div>
    </BottomSheet>
  );
}

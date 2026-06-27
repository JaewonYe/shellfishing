'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CctvItem {
  name: string;
  url: string;
  lat: number;
  lng: number;
}

interface CctvLayerProps {
  kakaoMap: any;
  visible: boolean;
}

function makeCctvMarker(): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'transform:translate(-50%,-50%);cursor:pointer;';
  el.innerHTML = `
    <div style="
      width:32px;height:32px;border-radius:50%;
      background:#d32f2f;
      border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98z"/>
      </svg>
    </div>
  `;
  return el;
}

export default function CctvLayer({ kakaoMap, visible }: CctvLayerProps) {
  const overlaysRef = useRef<any[]>([]);
  const [items, setItems] = useState<CctvItem[]>([]);
  const [selected, setSelected] = useState<CctvItem | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBoundsRef = useRef<string>('');

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
  }, []);

  const fetchCctv = useCallback(async (map: any) => {
    if (!map) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const key = `${sw.getLng().toFixed(3)},${sw.getLat().toFixed(3)},${ne.getLng().toFixed(3)},${ne.getLat().toFixed(3)}`;
    if (key === lastBoundsRef.current) return;
    lastBoundsRef.current = key;

    try {
      const res = await fetch(
        `/api/cctv?minX=${sw.getLng()}&maxX=${ne.getLng()}&minY=${sw.getLat()}&maxY=${ne.getLat()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!kakaoMap || !visible) {
      clearOverlays();
      setItems([]);
      lastBoundsRef.current = '';
      return;
    }

    fetchCctv(kakaoMap);

    const handler = () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => fetchCctv(kakaoMap), 500);
    };

    window.kakao.maps.event.addListener(kakaoMap, 'idle', handler);
    return () => {
      window.kakao.maps.event.removeListener(kakaoMap, 'idle', handler);
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [kakaoMap, visible, fetchCctv, clearOverlays]);

  useEffect(() => {
    clearOverlays();
    if (!kakaoMap || !visible || items.length === 0) return;

    items.forEach(item => {
      const pos = new window.kakao.maps.LatLng(item.lat, item.lng);
      const content = makeCctvMarker();
      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: 0.5,
        zIndex: 3,
      });
      overlay.setMap(kakaoMap);

      content.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelected(item);
      });

      overlaysRef.current.push(overlay);
    });
  }, [kakaoMap, visible, items, clearOverlays]);

  if (!selected) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/50"
      onClick={() => setSelected(null)}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-bold text-gray-800 truncate">{selected.name}</h3>
          <button
            onClick={() => setSelected(null)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="aspect-video bg-black">
          {selected.url ? (
            <video
              src={selected.url}
              autoPlay
              muted
              playsInline
              controls
              className="w-full h-full object-contain"
              onError={(e) => {
                const el = e.currentTarget;
                const parent = el.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <iframe src="${selected.url}" class="w-full h-full border-0" allow="autoplay" allowfullscreen></iframe>
                  `;
                }
              }}
            />
          ) : (
            <p className="text-white text-sm flex items-center justify-center h-full">영상을 불러올 수 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

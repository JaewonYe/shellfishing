'use client';

import { useEffect, useRef } from 'react';

interface TideStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
  sea: string;
}

interface TideLayerProps {
  kakaoMap: any;
  visible: boolean;
  onStationSelect?: (station: { code: string; name: string; sea: string; lat: number; lng: number }) => void;
}

const SEA_COLOR: Record<string, string> = {
  '서해': '#1565c0',
  '남해': '#00838f',
  '동해': '#1b5e20',
  '제주': '#6a1b9a',
};

function makeMarkerEl(station: TideStation): HTMLElement {
  const color = SEA_COLOR[station.sea] ?? '#0d47a1';
  const el = document.createElement('div');
  el.style.cssText = 'transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer;';
  el.innerHTML = `
    <div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
        <path d="M2 17c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
        <path d="M2 7c1.5-2 3-3 4.5-3s3 2 4.5 2 3-2 4.5-2 3 1 4.5 3"/>
      </svg>
    </div>
    <div style="
      margin-top:3px;
      background:${color};
      color:white;
      font-size:10px;
      font-weight:600;
      padding:1px 5px;
      border-radius:4px;
      white-space:nowrap;
      box-shadow:0 1px 3px rgba(0,0,0,0.3);
    ">${station.name}</div>
  `;
  return el;
}

export default function TideLayer({ kakaoMap, visible, onStationSelect }: TideLayerProps) {
  const overlaysRef = useRef<any[]>([]);
  const loadedRef = useRef(false);
  const onSelectRef = useRef(onStationSelect);
  onSelectRef.current = onStationSelect;

  useEffect(() => {
    if (!kakaoMap) return;

    const show = () => overlaysRef.current.forEach(o => o.setMap(kakaoMap));
    const hide = () => overlaysRef.current.forEach(o => o.setMap(null));

    if (!loadedRef.current) {
      loadedRef.current = true;
      fetch('/api/tide-stations')
        .then(r => r.json())
        .then((stations: TideStation[]) => {
          stations.forEach(station => {
            const el = makeMarkerEl(station);
            el.title = `${station.name} (${station.sea})`;
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectRef.current?.({ code: station.code, name: station.name, sea: station.sea, lat: station.lat, lng: station.lng });
            });

            const overlay = new window.kakao.maps.CustomOverlay({
              position: new window.kakao.maps.LatLng(station.lat, station.lng),
              content: el,
              zIndex: 15,
            });
            overlaysRef.current.push(overlay);
          });
          if (visible) show();
        });
    } else {
      visible ? show() : hide();
    }
  }, [kakaoMap, visible]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => { overlaysRef.current.forEach(o => o.setMap(null)); };
  }, []);

  return null;
}

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Map as KakaoMapView,
  MapMarker,
  MapTypeControl,
  ZoomControl,
  Polygon,
  CustomOverlayMap,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';

// ── 타입 ──────────────────────────────────────────
export interface FarmProperties {
  id: string;
  name: string;
  type: string;
  kind: string;
  species: string;
  area: number | null;
  lcns_no: string;
  period: string;
  org: string;
  sgg: string;
  ctpv: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface PlaceResult {
  place_name: string;
  road_address_name: string;
  address_name: string;
  category_name: string;
  x: string; // lng
  y: string; // lat
}

export interface KakaoMapHandle {
  moveToLocation: () => void;
  refresh: () => void;
  deselectPolygon: () => void;
  panTo: (lat: number, lng: number, level?: number) => void;
  searchPlaces: (keyword: string, callback: (results: PlaceResult[], status: string) => void) => void;
}

interface KakaoMapProps {
  onFarmSelect: (farm: FarmProperties | null) => void;
  onMapReady?: (map: any) => void;
  showVillage?: boolean;
  showAqua?: boolean;
  showSetnet?: boolean;
}

// kakao SDK global 타입 선언 (panTo·검색·위치이동 등 services 호출에 필요)
declare global {
  interface Window {
    kakao: any;
  }
}

// ── 스타일 상수 ───────────────────────────────────
const FILL_NORMAL    = '#4fc3f7';
const FILL_SELECTED  = '#0277bd';
const STROKE_NORMAL  = '#1565c0';
const STROKE_EXPIRED = '#e53935';

function isExpired(period: string): boolean {
  if (!period || period === '-') return false;
  const m = period.match(/(\d{4}\.\d{2}\.\d{2})\s*$/);
  if (!m) return false;
  const end = new Date(m[1].replace(/\./g, '-'));
  return !isNaN(end.getTime()) && end < new Date();
}

// ── 상수 ──────────────────────────────────────────
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? '';
const MAP_CENTER = { lat: 34.9, lng: 128.0 };
const MAP_LEVEL = 8;
const MAX_RENDER_LEVEL = 11; // 이 줌 레벨 초과 시 폴리곤 숨김
const MAX_ICON_LEVEL   = 9;  // 이 줌 레벨 초과 시 아이콘 숨김

// 어종명 → SVG 파일명 우선순위 매핑
const SPECIES_KEYWORDS: [string, string][] = [
  ['바지락','바지락'],['가무락','가무락'],['동죽','동죽'],['가리비','가리비'],
  ['피조개','피조개'],['새조개','새조개'],['꼬막','꼬막'],['고막','고막'],
  ['개조개','개조개'],['키조개','키조개'],['가리맛','가리맛'],['대합','대합'],
  ['기조개','기조개'],['비단조개','비단조개'],['떡조개','떡조개'],
  ['새고막','새고막'],['비합','비합'],
  ['백합','백합'],
  ['굴','굴'],
  ['참맛','참맛'],['맛','참맛'],    // 맛/참맛 → 참맛 아이콘
  ['전복','전복'],['해삼','해삼'],['낙지','낙지'],['성게','성게'],
  ['문어','문어'],['소라','소라'],['고둥','고둥'],['홍합','홍합'],
  ['개불','개불'],['갯지렁이','갯지렁이'],['짱뚱어','짱뚱어'],
  ['게','게'],
  ['다시마','다시마'],['미역','미역'],['천초','천초'],
  ['가시파래','가시파래'],['파래','파래'],
  ['돌김','돌김'],['우묵가사리','우묵가사리'],
  ['우렁쉥이','우렁쉥이'],['멸치','멸치'],['골뱅이','골뱅이'],
];

function getIconNames(species: string | null | undefined): string[] {
  if (!species || species === '-') return [];
  return SPECIES_KEYWORDS
    .filter(([kw]) => species.includes(kw))
    .map(([, icon]) => icon);
}

function getFeatureCentroid(feature: any): { lat: number; lng: number } | null {
  const p = feature.properties;
  if (p.lat && p.lng) return { lat: p.lat, lng: p.lng };
  try {
    const coords: number[][] = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates[0][0];
    const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
    const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
    return { lat, lng };
  } catch { return null; }
}

// ── GeoJSON geometry → {lat,lng} 좌표 배열 (선언적 <Polygon path> 용) ──
// MultiPolygon은 원본과 동일하게 하위 폴리곤마다 별도 <Polygon>으로 분리
function toLatLngPaths(geometry: any): { lat: number; lng: number }[][] {
  if (!geometry) return [];
  const { type, coordinates } = geometry;
  if (type === 'Polygon') {
    return [coordinates[0].map(([lng, lat]: number[]) => ({ lat, lng }))];
  }
  if (type === 'MultiPolygon') {
    return coordinates.map((poly: number[][][]) =>
      poly[0].map(([lng, lat]: number[]) => ({ lat, lng })));
  }
  return [];
}

// ── 폴리곤 스타일 (선택·호버·만료 상태를 props로 계산 — setOptions 불필요) ──
function polygonStyle(feature: any, isSelected: boolean, isHovered: boolean) {
  const expired = isExpired(feature.properties?.period ?? '');
  const strokeColor = expired ? STROKE_EXPIRED : STROKE_NORMAL;
  const strokeStyle = expired ? 'shortdash' : 'solid';
  if (isSelected) {
    return { fillColor: FILL_SELECTED, fillOpacity: 0.55, strokeColor, strokeStyle, strokeWeight: 3 };
  }
  return {
    fillColor: FILL_NORMAL,
    fillOpacity: isHovered ? (expired ? 0.28 : 0.5) : (expired ? 0.12 : 0.3),
    strokeColor,
    strokeStyle,
    strokeWeight: isHovered ? 3 : 2,
  };
}

// ── 어종 아이콘 뱃지 (오버레이 컨텐츠를 JSX로 선언) ──
function SpeciesIconBadge({ icons, onSelect }: { icons: string[]; onSelect: () => void }) {
  const iconSize = icons.length === 1 ? 32 : icons.length <= 4 ? 26 : 22;
  const cols = Math.min(icons.length, 3);
  const rows = Math.ceil(icons.length / cols);
  const gap = 2;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className="grid cursor-pointer"
      style={{
        width: cols * iconSize + (cols - 1) * gap,
        height: rows * iconSize + (rows - 1) * gap,
        gridTemplateColumns: `repeat(${cols}, ${iconSize}px)`,
        gap,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
      }}
    >
      {icons.map((name) => (
        <img
          key={name}
          src={`/icons/species/${encodeURIComponent(name)}.svg`}
          width={iconSize}
          height={iconSize}
          title={name}
          className="block"
        />
      ))}
    </div>
  );
}

// ── 행정 카테고리 텍스트 뱃지 ──
function CategoryBadge({ label, onSelect }: { label: string; onSelect: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className="max-w-[90px] px-[5px] py-0.5 bg-[rgba(255,255,255,0.88)] border border-[rgba(21,101,192,0.35)] rounded text-[10px] leading-[1.3] text-[#1a237e] text-center shadow-[0_1px_3px_rgba(0,0,0,0.25)] cursor-pointer"
      style={{ wordBreak: 'keep-all', pointerEvents: 'auto' }}
    >
      {label}
    </div>
  );
}

// ── 샘플 데이터 (GeoJSON 없을 때) ─────────────────
function getSampleFeatures() {
  const farms = [
    { name: '창선 당항', sgg: '경상남도 남해군', coords: [[128.720,34.840],[128.740,34.840],[128.745,34.860],[128.725,34.865],[128.715,34.855],[128.720,34.840]], area: 12.2, lat: 34.897, lng: 128.021 },
    { name: '창선 율도', sgg: '경상남도 남해군', coords: [[128.400,34.810],[128.440,34.810],[128.445,34.835],[128.415,34.840],[128.395,34.828],[128.400,34.810]], area: 14.5, lat: 34.902, lng: 127.989 },
    { name: '여수 남면', sgg: '전남 여수시',     coords: [[127.830,34.605],[127.870,34.605],[127.875,34.635],[127.840,34.640],[127.825,34.625],[127.830,34.605]], area: 69.0, lat: 34.620, lng: 127.850 },
    { name: '완도읍',   sgg: '전남 완도군',     coords: [[126.720,34.330],[126.780,34.330],[126.785,34.370],[126.750,34.380],[126.715,34.365],[126.720,34.330]], area: 128.0, lat: 34.350, lng: 126.750 },
    { name: '진도읍',   sgg: '전남 진도군',     coords: [[126.240,34.470],[126.300,34.470],[126.305,34.510],[126.265,34.520],[126.235,34.500],[126.240,34.470]], area: 45.0, lat: 34.490, lng: 126.270 },
  ];
  return farms.map((f, i) => ({
    type: 'Feature',
    properties: { id: `sample-${i}`, name: f.name, type: '마을어업', kind: '마을어업',
      species: '-', area: f.area, lcns_no: '-', period: '-', org: '해양수산과',
      sgg: f.sgg, ctpv: '-', address: `${f.sgg} ${f.name}`, lat: f.lat, lng: f.lng },
    geometry: { type: 'Polygon', coordinates: [f.coords] },
  }));
}

// ── 피처에 bbox 사전 계산 ────────────────────────
function addBbox(features: any[]): any[] {
  return features.map(f => {
    const coords = f.geometry?.coordinates;
    if (!coords) return { ...f, _bbox: null };
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    const walk = (c: any) => {
      if (typeof c[0] === 'number') {
        if (c[0] < minLng) minLng = c[0];
        if (c[1] < minLat) minLat = c[1];
        if (c[0] > maxLng) maxLng = c[0];
        if (c[1] > maxLat) maxLat = c[1];
      } else { c.forEach(walk); }
    };
    walk(coords);
    return { ...f, _bbox: { minLng, minLat, maxLng, maxLat } };
  });
}

// ── 컴포넌트 ──────────────────────────────────────
const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { onFarmSelect, onMapReady, showVillage = true, showAqua = true, showSetnet = true },
  ref,
) {
  useKakaoLoader({ appkey: KAKAO_KEY, libraries: ['services'] });

  const [map, setMap] = useState<any>(null);

  // 레이어별 피처 배열 (전체 데이터 — 화면 표시 여부와 무관하게 보관)
  const villageRef      = useRef<any[]>([]);
  const aquaRef         = useRef<any[]>([]);
  const setnetRef       = useRef<any[]>([]);
  const aquaLoadedRef   = useRef(false);
  const setnetLoadedRef = useRef(false);
  // props → ref (stale closure 방지)
  const showVillageRef = useRef(showVillage);
  const showAquaRef    = useRef(showAqua);
  const showSetnetRef  = useRef(showSetnet);
  const onSelectRef    = useRef(onFarmSelect);
  const idleTimerRef   = useRef<ReturnType<typeof setTimeout>>();

  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 화면에 보여줄 피처 — JSX가 그대로 렌더링하는 선언적 상태
  const [visibleFeatures, setVisibleFeatures] = useState<any[]>([]);
  const [overlayFeatures, setOverlayFeatures] = useState<any[]>([]);
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [hoveredId,  setHoveredId]            = useState<string | null>(null);
  const [myLocation, setMyLocation]           = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => { onSelectRef.current = onFarmSelect; },     [onFarmSelect]);
  useEffect(() => { showVillageRef.current = showVillage; },   [showVillage]);
  useEffect(() => { showAquaRef.current = showAqua; },         [showAqua]);
  useEffect(() => { showSetnetRef.current = showSetnet; },     [showSetnet]);

  // ── 토스트 ────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);

  // ── 피처 bbox와 맵 범위 교차 여부 ────────────────
  const inBounds = useCallback((feature: any, sw: any, ne: any): boolean => {
    const b = feature._bbox;
    if (!b) return false;
    return !(
      b.maxLat < sw.getLat() ||
      b.minLat > ne.getLat() ||
      b.maxLng < sw.getLng() ||
      b.minLng > ne.getLng()
    );
  }, []);

  // ── 격자 기반 아이콘 클러스터링 ──────────────
  // 줌 레벨에 따라 격자 크기를 키워 셀당 대표 피처 1개만 아이콘 표시
  const clusterForOverlays = useCallback((features: any[], level: number): any[] => {
    const gridSize = 0.005 * Math.pow(2, level - 5); // level8≈0.04°(~4km), level6≈0.01°(~1km)
    const cellMap = new Map<string, any>();
    for (const f of features) {
      const c = getFeatureCentroid(f);
      if (!c) continue;
      const key = `${Math.floor(c.lat / gridSize)},${Math.floor(c.lng / gridSize)}`;
      const existing = cellMap.get(key);
      if (!existing) {
        cellMap.set(key, f);
      } else {
        // 아이콘이 더 많은(정보가 더 풍부한) 피처를 대표로 선택
        const ni = getIconNames(f.properties?.species ?? '').length;
        const ei = getIconNames(existing.properties?.species ?? '').length;
        if (ni > ei) cellMap.set(key, f);
      }
    }
    return Array.from(cellMap.values());
  }, []);

  // ── 현재 화면 범위 피처 선택 → state 갱신 (JSX가 알아서 다시 그림) ──
  const renderVisible = useCallback(() => {
    if (!map) return;
    const level = map.getLevel();
    if (level > MAX_RENDER_LEVEL) {
      setVisibleFeatures([]);
      setOverlayFeatures([]);
      return;
    }
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const all = [
      ...(showVillageRef.current ? villageRef.current : []),
      ...(showAquaRef.current    ? aquaRef.current    : []),
      ...(showSetnetRef.current  ? setnetRef.current  : []),
    ];
    const visible = all.filter(f => inBounds(f, sw, ne));
    setVisibleFeatures(visible);
    setOverlayFeatures(level <= MAX_ICON_LEVEL ? clusterForOverlays(visible, level) : []);
  }, [map, inBounds, clusterForOverlays]);

  // ── GeoJSON 로드 ──────────────────────────────
  const loadData = useCallback(async () => {
    const jobs: Promise<void>[] = [];

    jobs.push(
      fetch('/fishfarms.geojson')
        .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
        .then(json => { villageRef.current = addBbox(json.features ?? []); })
        .catch(() => {
          villageRef.current = addBbox(getSampleFeatures());
        }),
    );

    if (showAquaRef.current && !aquaLoadedRef.current) {
      aquaLoadedRef.current = true;
      jobs.push(
        fetch('/aquafarms.geojson')
          .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
          .then(json => { aquaRef.current = addBbox(json.features ?? []); })
          .catch(() => { aquaLoadedRef.current = false; }),
      );
    }

    if (showSetnetRef.current && !setnetLoadedRef.current) {
      setnetLoadedRef.current = true;
      jobs.push(
        fetch('/setnets.geojson')
          .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
          .then(json => { setnetRef.current = addBbox(json.features ?? []); })
          .catch(() => { setnetLoadedRef.current = false; }),
      );
    }

    await Promise.all(jobs);
    const total = villageRef.current.length + aquaRef.current.length + setnetRef.current.length;
    if (total > 0) showToast(`어장 ${total.toLocaleString()}개 로드 완료`);
    else showToast('샘플 데이터로 표시 중 (geojson 파일 추가 시 실제 데이터 표시)');
    renderVisible();
  }, [renderVisible, showToast]);

  // ── 맵 생성 완료 ──────────────────────────────
  const handleMapCreate = useCallback((kakaoMap: any) => {
    setMap(kakaoMap);
    onMapReady?.(kakaoMap);
  }, [onMapReady]);

  // 맵이 준비되면 최초 1회 데이터 로드
  useEffect(() => {
    if (!map) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // 지도 이동/줌 완료 → 가시 범위 재렌더 (디바운스)
  const handleIdle = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(renderVisible, 400);
  }, [renderVisible]);

  // 지도 클릭 → 선택 해제
  const handleMapClick = useCallback(() => {
    setSelectedId(null);
    onSelectRef.current(null);
  }, []);

  // ── 레이어 토글 시 on-demand 로딩 + 재렌더 ──
  useEffect(() => {
    if (!map) return;
    const jobs: Promise<void>[] = [];

    if (showAqua && !aquaLoadedRef.current) {
      aquaLoadedRef.current = true;
      jobs.push(
        fetch('/aquafarms.geojson')
          .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
          .then(json => { aquaRef.current = addBbox(json.features ?? []); })
          .catch(() => { aquaLoadedRef.current = false; }),
      );
    }

    if (showSetnet && !setnetLoadedRef.current) {
      setnetLoadedRef.current = true;
      jobs.push(
        fetch('/setnets.geojson')
          .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
          .then(json => { setnetRef.current = addBbox(json.features ?? []); })
          .catch(() => { setnetLoadedRef.current = false; }),
      );
    }

    if (jobs.length > 0) {
      Promise.all(jobs).then(() => renderVisible());
    } else {
      renderVisible();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVillage, showAqua, showSetnet]);

  // ── 폴리곤 클릭 → 선택 ────────────────────────
  const handlePolygonClick = useCallback((feature: any, _target: any, mouseEvent: any) => {
    mouseEvent?.stop?.();
    setSelectedId(feature.properties.id);
    onSelectRef.current(feature.properties);
  }, []);

  // ── 오버레이 클릭 → 선택(폴리곤 강조 없이 정보만 표시, 기존 동작 유지) ──
  const handleOverlaySelect = useCallback((props: FarmProperties) => {
    setSelectedId(null);
    onSelectRef.current(props);
  }, []);

  // ── 현재 위치 이동 ────────────────────────────
  const moveToLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        map?.setCenter(new window.kakao.maps.LatLng(lat, lng));
        map?.setLevel(6);
        setMyLocation({ lat, lng });
        showToast('현재 위치로 이동했습니다.');
      },
      () => showToast('위치 정보를 가져올 수 없습니다.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [map, showToast]);

  // ── 데이터 새로고침 ───────────────────────────
  const refresh = useCallback(() => {
    villageRef.current  = [];
    aquaRef.current     = [];
    setnetRef.current   = [];
    aquaLoadedRef.current   = false;
    setnetLoadedRef.current = false;
    setSelectedId(null);
    setHoveredId(null);
    setVisibleFeatures([]);
    setOverlayFeatures([]);
    loadData();
  }, [loadData]);

  // ── 폴리곤 선택 해제 ──────────────────────────
  const deselectPolygon = useCallback(() => setSelectedId(null), []);

  // ── 좌표로 지도 이동 ──────────────────────────
  const panTo = useCallback((lat: number, lng: number, level = 5) => {
    if (!map) return;
    map.setCenter(new window.kakao.maps.LatLng(lat, lng));
    map.setLevel(level);
  }, [map]);

  // ── 장소 검색 ─────────────────────────────────
  const searchPlaces = useCallback((
    keyword: string,
    callback: (results: PlaceResult[], status: string) => void,
  ) => {
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any[], status: string) => {
      callback(data as PlaceResult[], status);
    });
  }, []);

  // ── 부모에 노출할 메서드 ──────────────────────
  useImperativeHandle(ref, () => ({ moveToLocation, refresh, deselectPolygon, panTo, searchPlaces }), [
    moveToLocation, refresh, deselectPolygon, panTo, searchPlaces,
  ]);

  return (
    <>
      <KakaoMapView
        center={MAP_CENTER}
        level={MAP_LEVEL}
        className="w-full h-full"
        onCreate={handleMapCreate}
        onClick={handleMapClick}
        onIdle={handleIdle}
      >
        {/* 지도/스카이뷰·줌 레벨 컨트롤 — 우측 하단 영역에 선언적으로 배치 */}
        <MapTypeControl position="BOTTOMRIGHT" />
        <ZoomControl position="BOTTOMLEFT" />

        {/* 어장 폴리곤 — 선택/호버/만료 상태에 따라 스타일을 props로 계산해 선언적으로 렌더링 */}
        {visibleFeatures.flatMap((feature) =>
          toLatLngPaths(feature.geometry).map((path, pi) => {
            if (path.length < 3) return null;
            const id = feature.properties.id;
            return (
              <Polygon
                key={`${id}-${pi}`}
                path={path}
                strokeOpacity={0.9}
                onClick={(target, mouseEvent) => handlePolygonClick(feature, target, mouseEvent)}
                onMouseover={() => setHoveredId(id)}
                onMouseout={() => setHoveredId(curr => (curr === id ? null : curr))}
                {...polygonStyle(feature, selectedId === id, hoveredId === id)}
              />
            );
          })
        )}

        {/* 어종 아이콘 / 행정 카테고리 뱃지 오버레이 */}
        {overlayFeatures.map((feature) => {
          const center = getFeatureCentroid(feature);
          if (!center) return null;
          const species: string = feature.properties?.species ?? '-';
          const icons = getIconNames(species);
          if (!icons.length && (!species || species === '-')) return null;
          return (
            <CustomOverlayMap key={feature.properties.id} position={center} clickable xAnchor={0.5} yAnchor={0.5} zIndex={5}>
              {icons.length ? (
                <SpeciesIconBadge icons={icons} onSelect={() => handleOverlaySelect(feature.properties)} />
              ) : (
                <CategoryBadge label={species} onSelect={() => handleOverlaySelect(feature.properties)} />
              )}
            </CustomOverlayMap>
          );
        })}

        {/* 현재 위치 마커 */}
        {myLocation && <MapMarker position={myLocation} title="내 위치" />}
      </KakaoMapView>

      {/* 토스트 */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-sm px-5 py-2.5 rounded-full whitespace-nowrap z-20 animate-pulse">
          {toast}
        </div>
      )}
    </>
  );
});

export default KakaoMap;

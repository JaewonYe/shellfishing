'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import KakaoMap, { KakaoMapHandle, FarmProperties } from '@/components/KakaoMap';
import SearchBar from '@/components/SearchBar';
import TideLayer from '@/components/TideLayer';
import { TideStationInfo } from '@/components/TideInfoContent';
import SelectionPanel, { PanelSelection } from '@/components/SelectionPanel';
import FishingBan from '@/components/FishingBan';
import MyPage, { Favorite } from '@/components/MyPage';
import MorePage from '@/components/MorePage';
import CctvLayer from '@/components/CctvLayer';
import FavoritePickPanel from '@/components/FavoritePickPanel';
import BottomNav, { AppTab } from '@/components/BottomNav';

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('map');
  const [selection, setSelection] = useState<PanelSelection>(null);
  const [kakaoMap, setKakaoMap] = useState<any>(null);
  const [tideVisible, setTideVisible] = useState(true);
  const [showVillage, setShowVillage] = useState(true);
  const [showAqua, setShowAqua] = useState(true);
  const [showSetnet, setShowSetnet] = useState(true);
  const [cctvVisible, setCctvVisible] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<KakaoMapHandle>(null);

  const handleFarmSelect = useCallback((farm: FarmProperties | null) => {
    setSelection(farm ? { kind: 'farm', data: farm } : null);
  }, []);

  const handleStationSelect = useCallback((station: TideStationInfo) => {
    setSelection({ kind: 'station', data: station });
    mapRef.current?.deselectPolygon();
  }, []);

  const handleLocationClick = useCallback(() => {
    mapRef.current?.moveToLocation();
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelection(null);
    mapRef.current?.deselectPolygon();
  }, []);

  const handleAddFavorite = useCallback(() => {
    setActiveTab('map');
    setPickMode(true);
    setSelection(null);
  }, []);

  const handlePick = useCallback((lat: number, lng: number) => {
    setPickedLocation({ lat, lng });
  }, []);

  const handlePickPanelClose = useCallback(() => {
    setPickedLocation(null);
    setPickMode(false);
  }, []);

  const handleFavoriteSaved = useCallback(() => {
    setPickedLocation(null);
    setPickMode(false);
  }, []);

  const handleViewFavorite = useCallback((favorite: Favorite) => {
    setActiveTab('map');
    setSelection(null);
    requestAnimationFrame(() => mapRef.current?.panTo(favorite.lat, favorite.lng, 5));
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <Header />
      <div className="relative flex-1 min-h-0">
        {/* 지도 탭 */}
        <div className={`absolute inset-0 ${activeTab === 'map' ? '' : 'invisible pointer-events-none'}`}>
          <KakaoMap
            ref={mapRef}
            onFarmSelect={handleFarmSelect}
            onMapReady={setKakaoMap}
            showVillage={showVillage}
            showAqua={showAqua}
            showSetnet={showSetnet}
            pickMode={pickMode}
            onPick={handlePick}
            pickedLocation={pickedLocation}
          />
          <TideLayer kakaoMap={kakaoMap} visible={tideVisible} onStationSelect={handleStationSelect} />
          <CctvLayer kakaoMap={kakaoMap} visible={cctvVisible} />
          <SearchBar mapRef={mapRef} />

          {pickMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 text-white text-xs px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2">
              지도를 눌러 관심 지역을 선택하세요
              <button onClick={handlePickPanelClose} className="text-white/70 active:text-white">취소</button>
            </div>
          )}

          <button
            onClick={handleLocationClick}
            className="absolute top-16 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg active:bg-gray-100 transition-colors"
            aria-label="내 위치로 이동"
            title="내 위치"
          >
            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          </button>

          <SelectionPanel selection={selection} onClose={handlePanelClose} />
          <FavoritePickPanel location={pickedLocation} onClose={handlePickPanelClose} onSaved={handleFavoriteSaved} />
        </div>

        {/* 금지정보 탭 */}
        {activeTab === 'ban' && (
          <div className="absolute inset-0">
            <FishingBan />
          </div>
        )}

        {/* 마이 탭 */}
        {activeTab === 'my' && (
          <div className="absolute inset-0">
            <MyPage onAddFavorite={handleAddFavorite} onViewFavorite={handleViewFavorite} />
          </div>
        )}

        {/* 기타 탭 */}
        {activeTab === 'more' && (
          <MorePage
            showVillage={showVillage}
            onVillageToggle={() => setShowVillage(v => !v)}
            showAqua={showAqua}
            onAquaToggle={() => setShowAqua(v => !v)}
            showSetnet={showSetnet}
            onSetnetToggle={() => setShowSetnet(v => !v)}
            tideVisible={tideVisible}
            onTideToggle={() => setTideVisible(v => !v)}
            cctvVisible={cctvVisible}
            onCctvToggle={() => setCctvVisible(v => !v)}
          />
        )}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

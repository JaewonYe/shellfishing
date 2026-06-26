'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import KakaoMap, { KakaoMapHandle, FarmProperties } from '@/components/KakaoMap';
import SearchBar from '@/components/SearchBar';
import TideLayer from '@/components/TideLayer';
import { TideStationInfo } from '@/components/TideInfoContent';
import SelectionPanel, { PanelSelection } from '@/components/SelectionPanel';
import Calendar from '@/components/Calendar';
import FishingBan from '@/components/FishingBan';
import BottomNav, { AppTab } from '@/components/BottomNav';

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>('map');
  const [selection, setSelection] = useState<PanelSelection>(null);
  const [kakaoMap, setKakaoMap] = useState<any>(null);
  const [tideVisible, setTideVisible] = useState(true);
  const [showVillage, setShowVillage] = useState(true);
  const [showAqua, setShowAqua] = useState(true);
  const [showSetnet, setShowSetnet] = useState(true);
  const mapRef = useRef<KakaoMapHandle>(null);

  const handleFarmSelect = useCallback((farm: FarmProperties | null) => {
    console.log('[DEBUG] handleFarmSelect called, farm=', farm ? farm.name : 'null');
    setSelection(farm ? { kind: 'farm', data: farm } : null);
  }, []);

  const handleStationSelect = useCallback((station: TideStationInfo) => {
    setSelection({ kind: 'station', data: station });
    mapRef.current?.deselectPolygon();
  }, []);

  const handleLocationClick = useCallback(() => {
    mapRef.current?.moveToLocation();
  }, []);

  const handleRefreshClick = useCallback(() => {
    mapRef.current?.refresh();
  }, []);

  const handlePanelClose = useCallback(() => {
    console.log('[DEBUG] handlePanelClose called');
    setSelection(null);
    mapRef.current?.deselectPolygon();
  }, []);

  return (
    <div className="flex flex-col h-dvh">
      <Header
        activeTab={activeTab}
        onLocationClick={handleLocationClick}
        onRefreshClick={handleRefreshClick}
        tideVisible={tideVisible}
        onTideToggle={() => setTideVisible(v => !v)}
        showVillage={showVillage}
        onVillageToggle={() => setShowVillage(v => !v)}
        showAqua={showAqua}
        onAquaToggle={() => setShowAqua(v => !v)}
        showSetnet={showSetnet}
        onSetnetToggle={() => setShowSetnet(v => !v)}
      />
      <div className="relative flex-1 min-h-0">
        {/* 지도 탭 — 카카오맵 SDK 재초기화 방지를 위해 hidden 대신 visibility로 숨김 */}
        <div className={`absolute inset-0 ${activeTab === 'map' ? '' : 'invisible pointer-events-none'}`}>
          <KakaoMap
            ref={mapRef}
            onFarmSelect={handleFarmSelect}
            onMapReady={setKakaoMap}
            showVillage={showVillage}
            showAqua={showAqua}
            showSetnet={showSetnet}
          />
          <TideLayer kakaoMap={kakaoMap} visible={tideVisible} onStationSelect={handleStationSelect} />
          <SearchBar mapRef={mapRef} />
          <SelectionPanel selection={selection} onClose={handlePanelClose} />
        </div>

        {/* 달력 탭 */}
        {activeTab === 'calendar' && (
          <div className="absolute inset-0">
            <Calendar />
          </div>
        )}

        {/* 금어기 탭 */}
        {activeTab === 'ban' && (
          <div className="absolute inset-0">
            <FishingBan />
          </div>
        )}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import KakaoMap, { KakaoMapHandle, FarmProperties } from '@/components/KakaoMap';
import SearchBar from '@/components/SearchBar';
import TideLayer from '@/components/TideLayer';
import { TideStationInfo } from '@/components/TideInfoContent';
import SelectionPanel, { PanelSelection } from '@/components/SelectionPanel';
import FishingBan from '@/components/FishingBan';
import FeedbackPage from '@/components/FeedbackPage';
import MorePage from '@/components/MorePage';
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
          />
          <TideLayer kakaoMap={kakaoMap} visible={tideVisible} onStationSelect={handleStationSelect} />
          <SearchBar mapRef={mapRef} />

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
        </div>

        {/* 금지정보 탭 */}
        {activeTab === 'ban' && (
          <div className="absolute inset-0">
            <FishingBan />
          </div>
        )}

        {/* 개선요청 탭 */}
        {activeTab === 'feedback' && (
          <div className="absolute inset-0">
            <FeedbackPage />
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
          />
        )}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

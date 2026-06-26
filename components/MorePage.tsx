'use client';

interface MorePageProps {
  showVillage: boolean;
  onVillageToggle: () => void;
  showAqua: boolean;
  onAquaToggle: () => void;
  showSetnet: boolean;
  onSetnetToggle: () => void;
  tideVisible: boolean;
  onTideToggle: () => void;
}

const LAYERS = [
  { key: 'village' as const, label: '마을어업', desc: '마을 공동 어장 구역' },
  { key: 'aqua' as const, label: '양식어업', desc: '양식장 허가 구역' },
  { key: 'setnet' as const, label: '정치망어업', desc: '정치망 설치 구역' },
];

export default function MorePage({
  showVillage, onVillageToggle,
  showAqua, onAquaToggle,
  showSetnet, onSetnetToggle,
  tideVisible, onTideToggle,
}: MorePageProps) {
  const checked = { village: showVillage, aqua: showAqua, setnet: showSetnet };
  const onToggle = { village: onVillageToggle, aqua: onAquaToggle, setnet: onSetnetToggle };

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
          </div>
        </section>

        {/* 버전 정보 */}
        <p className="text-center text-xs text-gray-300 pb-4">v0.1.0</p>

      </div>
    </div>
  );
}

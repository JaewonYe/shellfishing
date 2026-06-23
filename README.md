# 해루질 맵

마을어장 · 양식어장 · 정치망어장 정보와 조위(물때) · 바다날씨를 지도 위에서 확인하는 PWA 웹앱.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **지도**: Kakao Maps SDK
- **PWA**: @ducanh2912/next-pwa
- **배포**: Cloudflare Pages (@cloudflare/next-on-pages)

## 주요 기능

- 전국 어장(마을·양식·정치망) 폴리곤을 지도에 표시
- 조위 관측소별 7일간 물때 연속 그래프 (코사인 보간)
- 3시간 간격 바다날씨 (기온, 풍속/풍향, 파고, 수온)
- 어장 상세 정보 (어종, 면적, 허가기간 등)
- 금어기 달력
- PWA 오프라인 지원

## 외부 API

| API | 용도 |
|-----|------|
| [KHOA 국립해양조사원](https://www.khoa.go.kr) | 조위 관측소 목록, 주간 물때 데이터 |
| [Open-Meteo Marine](https://open-meteo.com) | 파고·파주기·수온 |
| [Open-Meteo Forecast](https://open-meteo.com) | 기온·풍속·풍향·날씨 코드 |
| [Kakao Maps](https://apis.map.kakao.com) | 지도 렌더링 |

## 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:443`에서 실행됩니다.

> 카카오맵을 사용하려면 [Kakao Developers](https://developers.kakao.com)에서 JavaScript 앱 키를 발급받고
> `app/layout.tsx` 또는 `components/KakaoMap.tsx`에서 앱 키가 설정되어 있는지 확인하세요.

## Cloudflare Pages 배포

### 1. 사전 준비

- [Cloudflare](https://dash.cloudflare.com) 계정
- GitHub 등 Git 저장소에 프로젝트 푸시

### 2. 프로젝트 생성

1. Cloudflare 대시보드 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 저장소 선택 후 빌드 설정:

| 항목 | 값 |
|------|-----|
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |
| Node.js version | 18 이상 |

3. **환경 변수** (필요 시):
   - `NODE_VERSION`: `18`

4. **Save and Deploy** 클릭

### 3. 카카오맵 도메인 등록

배포 완료 후 `https://<프로젝트명>.pages.dev` 주소가 발급됩니다.

[Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 설정 → 플랫폼 → **Web** 사이트 도메인에 배포 URL을 추가하세요.

### 4. 커스텀 도메인 (선택)

Cloudflare Pages 프로젝트 설정 → **Custom domains** → 도메인 추가.
Cloudflare DNS를 사용하면 SSL 인증서가 자동으로 발급됩니다.

## 프로젝트 구조

```
app/
├── layout.tsx          # 루트 레이아웃 (메타데이터, PWA 설정)
├── page.tsx            # 메인 페이지 (상태 관리, 컴포넌트 조합)
└── api/
    ├── tide-stations/  # 조위 관측소 목록 API (Edge Runtime)
    └── tide-detail/    # 관측소별 물때·날씨 상세 API (Edge Runtime)

components/
├── KakaoMap.tsx        # 카카오맵 + 어장 폴리곤 렌더링
├── TideLayer.tsx       # 조위 관측소 마커 레이어
├── SelectionPanel.tsx  # 통합 하단 패널 (어장 정보 / 물때 정보 전환)
├── BottomSheet.tsx     # 하단 시트 공용 쉘 (애니메이션, 레이아웃)
├── FarmInfoContent.tsx # 어장 상세 정보 콘텐츠
├── TideInfoContent.tsx # 물때 그래프 + 바다날씨 콘텐츠
├── Header.tsx          # 상단 헤더 (레이어 토글)
├── SearchBar.tsx       # 검색바
├── BottomNav.tsx       # 하단 탭 네비게이션
├── Calendar.tsx        # 달력 뷰
└── FishingBan.tsx      # 금어기 정보

public/
├── tide-stations.json  # 조위 관측소 정적 폴백 데이터
├── fishfarms.geojson   # 전국 어장 GeoJSON
└── manifest.json       # PWA 매니페스트
```

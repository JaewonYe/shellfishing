import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shellfishing-map.pages.dev';

export const metadata: Metadata = {
  title: '공유해 — 바다 레저 정보 공유',
  description:
    '해루질·낚시 등 바다 레저에 필요한 어장 정보, 물때, 금어기를 한눈에 확인하세요.',
  keywords: [
    '공유해', '해루질', '낚시', '바다 레저', '마을어장', '양식어장',
    '물때', '조석', '금어기', '금지체장', '해산물 채취',
  ],
  manifest: '/manifest.json',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: '공유해 — 바다 레저 정보 공유',
    description:
      '어장 위치, 물때, 금어기 정보를 지도에서 확인하고 일정을 계획하세요.',
    url: SITE_URL,
    siteName: '공유해',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '공유해 — 바다 레저 정보 공유',
    description:
      '어장 위치, 물때, 금어기 정보를 지도에서 확인하고 일정을 계획하세요.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '공유해',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  other: {
    'naver-site-verification': '6becb5419cabac6d28e3ba3afd8641a3ed911567',
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d47a1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-ocean-dark">{children}</body>
    </html>
  );
}

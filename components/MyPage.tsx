'use client';

import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  nickname: string;
  profileImg: string;
  createdAt: string;
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback(() => {
    window.location.href = '/api/auth/kakao';
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {user ? (
          <>
            {/* 프로필 */}
            <section className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                {user.profileImg ? (
                  <img
                    src={user.profileImg}
                    alt="프로필"
                    className="w-14 h-14 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-ocean-pale flex items-center justify-center">
                    <svg className="w-7 h-7 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800">{user.nickname || '사용자'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </section>

            {/* 활동 요약 (추후 확장) */}
            <section className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">내 활동</h3>
              <p className="text-sm text-gray-400">아직 활동 내역이 없습니다.</p>
            </section>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm active:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>
          </>
        ) : (
          /* 로그인 전 */
          <section className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ocean-pale flex items-center justify-center">
              <svg className="w-8 h-8 text-ocean-mid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">로그인이 필요합니다</h2>
            <p className="text-sm text-gray-400 mb-5">
              로그인하면 내 활동을 관리할 수 있습니다.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl font-semibold text-sm active:opacity-75 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: '#FEE500', color: '#191919' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.76 5.01 4.4 6.35l-.95 3.52c-.06.22.2.4.38.27l4.17-2.74c.65.08 1.31.1 1.99.1 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
              카카오 로그인
            </button>
          </section>
        )}

      </div>
    </div>
  );
}

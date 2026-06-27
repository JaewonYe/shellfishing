'use client';

import { useCallback, useEffect, useState } from 'react';

interface UserItem {
  id: number;
  kakao_id: string;
  nickname: string;
  profile_img: string;
  role: string;
  login_count: number;
  last_login_at: string | null;
  created_at: string;
}

interface FeedbackItem {
  id: number;
  category: string;
  content: string;
  status: string;
  admin_reply: string | null;
  user_id: number | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-gray-100 text-gray-600' },
  'in-progress': { label: '진행중', color: 'bg-blue-100 text-blue-600' },
  resolved: { label: '완료', color: 'bg-green-100 text-green-600' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-600' },
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: '오류 신고',
  feature: '기능 요청',
  data: '데이터 오류',
  other: '기타 의견',
};

interface AdminPageProps {
  onBack: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const [tab, setTab] = useState<'users' | 'feedback'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    setLoading(true);
    if (tab === 'users') {
      fetch('/api/admin/users')
        .then(r => r.json())
        .then(d => setUsers(d.users ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch('/api/admin/feedback')
        .then(r => r.json())
        .then(d => setFeedbacks(d.items ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const handleRoleChange = useCallback(async (userId: number, role: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  }, []);

  const handleStatusChange = useCallback(async (id: number, status: string) => {
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  }, []);

  const handleReplySubmit = useCallback(async (id: number) => {
    if (!replyText.trim()) return;
    await fetch('/api/admin/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_reply: replyText.trim() }),
    });
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, admin_reply: replyText.trim() } : f));
    setReplyingId(null);
    setReplyText('');
  }, [replyText]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 active:text-gray-600">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800">관리자</h2>
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === 'users' ? 'bg-ocean-mid text-white' : 'bg-white text-gray-500'}`}
          >
            사용자 관리 ({users.length})
          </button>
          <button
            onClick={() => setTab('feedback')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === 'feedback' ? 'bg-ocean-mid text-white' : 'bg-white text-gray-500'}`}
          >
            개선요청 관리 ({feedbacks.length})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">불러오는 중...</p>
        ) : tab === 'users' ? (
          /* 사용자 목록 */
          <div className="space-y-3">
            {users.map(u => (
              <section key={u.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  {u.profile_img ? (
                    <img src={u.profile_img} alt="" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800 truncate">{u.nickname || '(없음)'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {u.role === 'admin' ? '관리자' : '일반'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">가입: {formatDate(u.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-lg font-bold text-ocean-mid">{u.login_count}</p>
                    <p className="text-[10px] text-gray-400">접속 횟수</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-[11px] font-medium text-gray-600">{formatDate(u.last_login_at)}</p>
                    <p className="text-[10px] text-gray-400">마지막 접속</p>
                  </div>
                </div>

                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-mid/30"
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </section>
            ))}
            {users.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">등록된 사용자가 없습니다.</p>
            )}
          </div>
        ) : (
          /* 개선요청 목록 */
          <div className="space-y-3">
            {feedbacks.map(f => (
              <section key={f.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-ocean-mid bg-ocean-pale px-2 py-0.5 rounded-full">
                    {CATEGORY_LABELS[f.category] ?? f.category}
                  </span>
                  <span className="text-[11px] text-gray-300">{formatDate(f.created_at)}</span>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mb-3">{f.content}</p>

                {/* 상태 변경 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] text-gray-400">상태:</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(STATUS_LABELS).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(f.id, key)}
                        className={`text-[11px] px-2 py-1 rounded-full font-medium transition-colors
                          ${f.status === key ? val.color : 'bg-gray-50 text-gray-300'}`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 관리자 답변 */}
                {f.admin_reply && replyingId !== f.id && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-2">
                    <p className="text-[11px] font-semibold text-blue-600 mb-1">관리자 답변</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.admin_reply}</p>
                  </div>
                )}

                {replyingId === f.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="답변을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean-mid/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReplySubmit(f.id)}
                        className="flex-1 py-2 rounded-lg bg-ocean-mid text-white text-sm font-semibold active:opacity-75"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => { setReplyingId(null); setReplyText(''); }}
                        className="py-2 px-4 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium active:bg-gray-200"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyingId(f.id); setReplyText(f.admin_reply ?? ''); }}
                    className="w-full py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium active:bg-gray-200"
                  >
                    {f.admin_reply ? '답변 수정' : '답변 작성'}
                  </button>
                )}
              </section>
            ))}
            {feedbacks.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">등록된 개선요청이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

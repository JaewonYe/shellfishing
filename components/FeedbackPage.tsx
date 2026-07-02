'use client';

import { useCallback, useEffect, useState } from 'react';

interface FeedbackItem {
  id: number | string;
  category: string;
  content: string;
  status?: string;
  admin_reply?: string;
  is_mine?: boolean;
  is_anonymous?: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'bug', label: '오류 신고' },
  { value: 'feature', label: '기능 요청' },
  { value: 'data', label: '데이터 오류' },
  { value: 'other', label: '기타 의견' },
];

const STORAGE_KEY = 'gongyuhae_feedback';

function loadLocal(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: FeedbackItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

interface FeedbackPageProps {
  onBack?: () => void;
}

export default function FeedbackPage({ onBack }: FeedbackPageProps = {}) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [category, setCategory] = useState('feature');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(data => {
        if (data.source === 'no-db') {
          setItems(loadLocal());
        } else {
          setItems(data.items ?? []);
          setUseApi(true);
          setLoggedIn(!!data.userId);
        }
      })
      .catch(() => {
        setItems(loadLocal());
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = content.trim();
    if (!text) return;
    if (!loggedIn && password.length < 4) return;

    if (useApi) {
      try {
        const body: any = { category, content: text };
        if (!loggedIn) body.password = password;
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const item = await res.json();
          setItems(prev => [item, ...prev]);
        }
      } catch {}
    } else {
      const item: FeedbackItem = {
        id: Date.now().toString(36),
        category,
        content: text,
        created_at: new Date().toISOString(),
      };
      const updated = [item, ...items];
      setItems(updated);
      saveLocal(updated);
    }

    setContent('');
    setPassword('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }, [category, content, password, items, useApi, loggedIn]);

  const performDelete = useCallback(async (id: number | string, pw?: string) => {
    if (useApi) {
      try {
        let url = `/api/feedback?id=${id}`;
        if (pw) url += `&password=${encodeURIComponent(pw)}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          if (data.error === 'wrong password') {
            setDeleteError('비밀번호가 일치하지 않습니다.');
            return;
          }
          return;
        }
      } catch { return; }
    }
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      if (!useApi) saveLocal(updated);
      return updated;
    });
    setDeletingId(null);
    setDeletePassword('');
    setDeleteError('');
  }, [useApi]);

  const handleDeleteClick = useCallback((id: number | string, isMine?: boolean, isAnonymous?: boolean) => {
    if (isMine) {
      performDelete(id);
    } else if (isAnonymous) {
      setDeletingId(id);
      setDeletePassword('');
      setDeleteError('');
    }
  }, [performDelete]);

  const handleDeleteConfirm = useCallback(() => {
    if (deletingId == null || !deletePassword) return;
    performDelete(deletingId, deletePassword);
  }, [deletingId, deletePassword, performDelete]);

  const categoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label ?? value;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const canDelete = (item: FeedbackItem) => item.is_mine || item.is_anonymous;

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* 헤더 */}
        {onBack && (
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 active:text-gray-600" aria-label="뒤로">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h2 className="text-base font-bold text-gray-800">개선 요청</h2>
          </div>
        )}

        {/* 작성 폼 */}
        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">개선 요청 등록</h3>

          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              분류
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${category === cat.value
                      ? 'bg-ocean-mid text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              내용
            </p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="개선 사항이나 오류를 자유롭게 작성해 주세요"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800
                         placeholder:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-ocean-mid/30 focus:border-ocean-mid"
            />
          </div>

          {/* 비회원 비밀번호 입력 */}
          {useApi && !loggedIn && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                삭제용 비밀번호
              </p>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="4자 이상 입력 (삭제 시 필요)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800
                           placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-ocean-mid/30 focus:border-ocean-mid"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || (useApi && !loggedIn && password.length < 4)}
            className="w-full py-3 rounded-xl bg-ocean-mid text-white font-semibold text-sm
                       active:opacity-75 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            등록하기
          </button>

          {submitted && (
            <p className="mt-3 text-center text-sm text-green-600 font-medium animate-pulse">
              등록되었습니다. 소중한 의견 감사합니다!
            </p>
          )}
        </section>

        {/* 등록된 요청 목록 */}
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">불러오는 중...</p>
        ) : items.length > 0 && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              등록된 요청 <span className="text-gray-400 font-normal">({items.length})</span>
            </h3>

            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-ocean-mid bg-ocean-pale px-2 py-0.5 rounded-full">
                      {categoryLabel(item.category)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-300">{formatDate(item.created_at)}</span>
                      {canDelete(item) && (
                        <button
                          onClick={() => handleDeleteClick(item.id, item.is_mine, item.is_anonymous)}
                          className="text-gray-300 hover:text-red-400 text-xs"
                          aria-label="삭제"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{item.content}</p>
                  {item.status && item.status !== 'pending' && (
                    <div className="mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${item.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                          item.status === 'resolved' ? 'bg-green-100 text-green-600' :
                          item.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {item.status === 'in-progress' ? '진행중' : item.status === 'resolved' ? '완료' : item.status === 'rejected' ? '반려' : item.status}
                      </span>
                    </div>
                  )}
                  {item.admin_reply && (
                    <div className="mt-2 bg-blue-50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-blue-600 mb-1">관리자 답변</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.admin_reply}</p>
                    </div>
                  )}

                  {/* 비밀번호 입력 모달 */}
                  {deletingId === item.id && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-gray-500">삭제하려면 비밀번호를 입력하세요</p>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                        placeholder="비밀번호"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-mid/30"
                      />
                      {deleteError && (
                        <p className="text-[11px] text-red-500">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteConfirm}
                          className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold active:opacity-75"
                        >
                          삭제
                        </button>
                        <button
                          onClick={() => { setDeletingId(null); setDeleteError(''); }}
                          className="py-2 px-4 rounded-lg bg-gray-200 text-gray-500 text-sm font-medium active:bg-gray-300"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

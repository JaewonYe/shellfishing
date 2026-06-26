'use client';

import { useCallback, useEffect, useState } from 'react';

interface FeedbackItem {
  id: number | string;
  category: string;
  content: string;
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

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [category, setCategory] = useState('feature');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(data => {
        if (data.source === 'no-db') {
          setItems(loadLocal());
        } else {
          setItems(data.items ?? []);
          setUseApi(true);
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

    if (useApi) {
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, content: text }),
        });
        if (res.ok) {
          const item = await res.json();
          setItems(prev => [item, ...prev]);
        }
      } catch { /* 폴백 없이 실패 */ }
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
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }, [category, content, items, useApi]);

  const handleDelete = useCallback(async (id: number | string) => {
    if (useApi) {
      try {
        await fetch(`/api/feedback?id=${id}`, { method: 'DELETE' });
      } catch { /* ignore */ }
    }
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    if (!useApi) saveLocal(updated);
  }, [items, useApi]);

  const categoryLabel = (value: string) =>
    CATEGORIES.find(c => c.value === value)?.label ?? value;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

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

          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
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
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-300 hover:text-red-400 text-xs"
                        aria-label="삭제"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{item.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

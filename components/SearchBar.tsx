'use client';

import { useEffect, useRef, useState } from 'react';
import { KakaoMapHandle, PlaceResult } from './KakaoMap';

interface SearchBarProps {
  mapRef: React.RefObject<KakaoMapHandle>;
}

export default function SearchBar({ mapRef }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = (keyword: string) => {
    if (!keyword.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setError('');
    mapRef.current?.searchPlaces(keyword, (res, status) => {
      setLoading(false);
      if (status === 'OK') {
        setResults(res);
        setOpen(true);
      } else if (status === 'ZERO_RESULT') {
        setResults([]);
        setError('검색 결과가 없습니다.');
        setOpen(true);
      } else {
        setResults([]);
        setError('검색 중 오류가 발생했습니다.');
        setOpen(true);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    search(query);
  };

  const handleSelect = (place: PlaceResult) => {
    mapRef.current?.panTo(parseFloat(place.y), parseFloat(place.x), 4);
    setQuery(place.place_name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  // 외부 클릭 시 드롭다운 닫기
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="absolute top-3 left-3 right-3 md:left-4 md:right-auto md:w-80 z-20"
    >
      {/* 검색 입력 */}
      <form onSubmit={handleSubmit} className="flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
        <button type="submit" className="pl-3.5 pr-2 text-gray-400 flex-shrink-0" aria-label="검색">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="장소 검색"
          className="flex-1 py-3 pr-2 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={handleClear} className="pr-3.5 text-gray-300 hover:text-gray-500 flex-shrink-0" aria-label="지우기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        )}
        {loading && (
          <span className="pr-3.5 flex-shrink-0">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </span>
        )}
      </form>

      {/* 검색 결과 드롭다운 */}
      {open && (
        <div className="mt-1.5 bg-white rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
          {error && !results.length ? (
            <p className="px-4 py-3 text-sm text-gray-400 text-center">{error}</p>
          ) : (
            <ul>
              {results.map((place, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-0"
                  >
                    <p className="text-sm font-semibold text-gray-800 truncate">{place.place_name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {place.road_address_name || place.address_name}
                    </p>
                    {place.category_name && (
                      <p className="text-[10px] text-ocean-mid mt-0.5 truncate">{place.category_name}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

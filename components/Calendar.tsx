'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── 타입 ──────────────────────────────────────────
interface CalEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (allDay면 '')
  endTime: string;    // HH:MM (allDay면 '')
  color: string;
  allDay: boolean;
}

type ViewMode = 'month' | 'week';

// ── 상수 ──────────────────────────────────────────
const DOW  = ['일', '월', '화', '수', '목', '금', '토'];
const HOUR_H = 52; // px per hour in week view
const COLORS = ['#4285f4','#ea4335','#34a853','#fbbc04','#ff6d00','#46bdc6','#7986cb','#e67c73'];
const STORAGE_KEY = 'shellfishing-events';

// ── 날짜 유틸 ──────────────────────────────────────
function dk(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const grid: Date[] = [];
  for (let i = 0; i < first.getDay(); i++)
    grid.push(new Date(year, month, 1 - first.getDay() + i));
  for (let d = 1; d <= last.getDate(); d++)
    grid.push(new Date(year, month, d));
  while (grid.length < 42)
    grid.push(new Date(year, month + 1, grid.length - last.getDate() - first.getDay() + 1));
  return grid;
}

function getWeekDays(anchor: Date): Date[] {
  const sun = new Date(anchor);
  sun.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun); d.setDate(sun.getDate() + i); return d;
  });
}

function minutesFromMidnight(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ── 이벤트 모달 ────────────────────────────────────
interface ModalState { date: string; initTime?: string; event?: CalEvent }

function EventModal({ state, onSave, onDelete, onClose }: {
  state: ModalState;
  onSave: (e: CalEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title,     setTitle]     = useState(state.event?.title     ?? '');
  const [selDate,   setSelDate]   = useState(state.event?.date      ?? state.date);
  const [allDay,    setAllDay]    = useState(state.event?.allDay    ?? true);
  const [startTime, setStartTime] = useState(state.event?.startTime ?? state.initTime ?? '09:00');
  const [endTime,   setEndTime]   = useState(state.event?.endTime   ?? '10:00');
  const [color,     setColor]     = useState(state.event?.color     ?? COLORS[0]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id:        state.event?.id ?? crypto.randomUUID(),
      title:     title.trim(),
      date:      selDate,
      allDay,
      startTime: allDay ? '' : startTime,
      endTime:   allDay ? '' : endTime,
      color,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md px-5 pt-5 pb-8 sm:pb-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-bold mb-4 text-gray-800">
          {state.event ? '일정 수정' : '새 일정'}
        </h2>

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="w-full border rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="date"
          value={selDate}
          onChange={e => setSelDate(e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allDay}
            onChange={e => setAllDay(e.target.checked)}
            className="w-4 h-4 accent-blue-500 rounded"
          />
          <span className="text-sm text-gray-700">하루 종일</span>
        </label>

        {!allDay && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        )}

        <div className="flex gap-2 mb-5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="py-2.5 px-4 rounded-xl border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50"
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40"
          >
            {state.event ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 월 뷰 ──────────────────────────────────────────
function MonthView({ year, month, todayKey, events, onDayClick, onEventClick }: {
  year: number; month: number; todayKey: string;
  events: CalEvent[];
  onDayClick: (date: string) => void;
  onEventClick: (e: CalEvent) => void;
}) {
  const grid = getMonthGrid(year, month);
  const evMap = new Map<string, CalEvent[]>();
  events.forEach(e => {
    const arr = evMap.get(e.date) ?? [];
    arr.push(e);
    evMap.set(e.date, arr);
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b flex-shrink-0 bg-gray-50">
        {DOW.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs py-1.5 font-semibold
              ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 격자 */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0 overflow-y-auto">
        {grid.map((day, idx) => {
          const key  = dk(day);
          const isToday  = key === todayKey;
          const isCurMon = day.getMonth() === month;
          const dow  = day.getDay();
          const dayEvs = evMap.get(key) ?? [];

          return (
            <div
              key={idx}
              onClick={() => onDayClick(key)}
              className={`border-b border-r flex flex-col cursor-pointer hover:bg-blue-50/40 active:bg-blue-100/40 transition-colors overflow-hidden
                ${!isCurMon ? 'bg-gray-50/60' : 'bg-white'}`}
            >
              {/* 날짜 숫자 */}
              <div className="flex items-center justify-center pt-1 pb-0.5 flex-shrink-0">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium
                  ${isToday
                    ? 'bg-blue-500 text-white'
                    : dow === 0 ? 'text-red-500'
                    : dow === 6 ? 'text-blue-500'
                    : isCurMon ? 'text-gray-800' : 'text-gray-300'}`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* 이벤트 */}
              <div className="flex flex-col gap-px px-0.5 pb-0.5 overflow-hidden">
                {dayEvs.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className="text-[10px] leading-[1.3rem] px-1 rounded truncate text-white font-medium"
                    style={{ background: ev.color }}
                  >
                    {!ev.allDay && ev.startTime ? `${ev.startTime.slice(0,5)} ` : ''}{ev.title}
                  </div>
                ))}
                {dayEvs.length > 3 && (
                  <div className="text-[10px] text-gray-400 px-1 leading-4">+{dayEvs.length - 3}개 더</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 주 뷰 ──────────────────────────────────────────
function WeekView({ anchor, todayKey, events, onSlotClick, onEventClick }: {
  anchor: Date; todayKey: string;
  events: CalEvent[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (e: CalEvent) => void;
}) {
  const week    = getWeekDays(anchor);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 현재 시각 또는 오전 8시 위치로 스크롤
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const top = (mins / 60) * HOUR_H - 80;
    el.scrollTop = Math.max(0, top);
  }, []);

  const allDayEvs  = events.filter(e => e.allDay);
  const timedEvs   = events.filter(e => !e.allDay && e.startTime);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 현재 시각 라인
  const now = new Date();
  const nowTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_H;
  const isThisWeek = week.some(d => dk(d) === todayKey);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 요일 헤더 */}
      <div className="flex border-b flex-shrink-0 bg-gray-50">
        <div className="w-11 flex-shrink-0" />
        {week.map((day, i) => {
          const key = dk(day);
          const isToday = key === todayKey;
          const dow = day.getDay();
          return (
            <div key={i} className="flex-1 text-center py-1.5 border-l">
              <div className={`text-[10px] font-medium mb-0.5
                ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                {DOW[dow]}
              </div>
              <div className={`text-sm font-semibold w-7 h-7 mx-auto flex items-center justify-center rounded-full
                ${isToday
                  ? 'bg-blue-500 text-white'
                  : dow === 0 ? 'text-red-500'
                  : dow === 6 ? 'text-blue-500'
                  : 'text-gray-800'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 하루 종일 이벤트 스트립 */}
      {allDayEvs.length > 0 && (
        <div className="flex border-b flex-shrink-0 bg-white min-h-[28px]">
          <div className="w-11 flex-shrink-0 text-[9px] text-gray-400 flex items-center justify-end pr-1.5">종일</div>
          {week.map((day, i) => {
            const key = dk(day);
            const dayEvs = allDayEvs.filter(e => e.date === key);
            return (
              <div key={i} className="flex-1 border-l px-0.5 py-0.5 flex flex-col gap-px overflow-hidden">
                {dayEvs.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className="text-[10px] leading-4 px-1 rounded truncate text-white font-medium cursor-pointer"
                    style={{ background: ev.color }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 시간 격자 (스크롤) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: `${24 * HOUR_H}px` }}>
          {/* 시간 레이블 */}
          <div className="w-11 flex-shrink-0 relative">
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-1.5 text-[10px] text-gray-400 -translate-y-2"
                style={{ top: h * HOUR_H }}
              >
                {h > 0 ? `${String(h).padStart(2, '0')}:00` : ''}
              </div>
            ))}
          </div>

          {/* 가로 선 */}
          <div className="absolute inset-0 left-11 pointer-events-none">
            {hours.map(h => (
              <div
                key={h}
                className="absolute w-full border-t border-gray-100"
                style={{ top: h * HOUR_H }}
              />
            ))}
          </div>

          {/* 현재 시각 라인 */}
          {isThisWeek && (
            <div
              className="absolute left-11 right-0 z-10 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                <div className="flex-1 h-px bg-red-500" />
              </div>
            </div>
          )}

          {/* 요일 컬럼 */}
          {week.map((day, di) => {
            const key = dk(day);
            const colEvs = timedEvs.filter(e => e.date === key);
            return (
              <div
                key={di}
                className="flex-1 border-l relative"
                onClick={e => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const relY = e.clientY - rect.top;
                  const totalMins = Math.round(relY / HOUR_H * 60 / 30) * 30;
                  const h = Math.min(23, Math.floor(totalMins / 60));
                  const m = totalMins % 60;
                  onSlotClick(key, `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
                }}
              >
                {colEvs.map(ev => {
                  const startMin = minutesFromMidnight(ev.startTime);
                  const endMin   = ev.endTime
                    ? minutesFromMidnight(ev.endTime)
                    : startMin + 60;
                  const top    = startMin / 60 * HOUR_H;
                  const height = Math.max((endMin - startMin) / 60 * HOUR_H, 20);
                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                      className="absolute text-white text-[10px] rounded px-1 truncate cursor-pointer hover:brightness-90 z-10"
                      style={{
                        top, height,
                        left: 1, right: 1,
                        background: ev.color,
                        lineHeight: `${Math.max(height, 20)}px`,
                      }}
                    >
                      {ev.startTime.slice(0, 5)} {ev.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 메인 캘린더 컴포넌트 ──────────────────────────
export default function Calendar() {
  const today  = new Date();
  const todayKey = dk(today);

  const [view,   setView]   = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [modal,  setModal]  = useState<ModalState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((evs: CalEvent[]) => {
    setEvents(evs);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(evs)); } catch {}
  }, []);

  // 네비게이션
  const goPrev = () => {
    if (view === 'month') setAnchor(a => new Date(a.getFullYear(), a.getMonth() - 1, 1));
    else setAnchor(a => { const d = new Date(a); d.setDate(d.getDate() - 7); return d; });
  };
  const goNext = () => {
    if (view === 'month') setAnchor(a => new Date(a.getFullYear(), a.getMonth() + 1, 1));
    else setAnchor(a => { const d = new Date(a); d.setDate(d.getDate() + 7); return d; });
  };
  const goToday = () =>
    setAnchor(view === 'month'
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today));

  // 툴바 레이블
  let label = '';
  if (view === 'month') {
    label = `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;
  } else {
    const week = getWeekDays(anchor);
    const s = week[0], e = week[6];
    if (s.getMonth() === e.getMonth())
      label = `${s.getFullYear()}년 ${s.getMonth()+1}월 ${s.getDate()}~${e.getDate()}일`;
    else
      label = `${s.getMonth()+1}월 ${s.getDate()}일 ~ ${e.getMonth()+1}월 ${e.getDate()}일`;
  }

  const handleSave = (ev: CalEvent) => {
    save(modal?.event
      ? events.map(e => e.id === ev.id ? ev : e)
      : [...events, ev]);
    setModal(null);
  };
  const handleDelete = () => {
    if (modal?.event) save(events.filter(e => e.id !== modal.event!.id));
    setModal(null);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">

      {/* 툴바 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-white flex-shrink-0">
        <button
          onClick={goToday}
          className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 font-medium text-gray-700 flex-shrink-0"
        >
          오늘
        </button>
        <button onClick={goPrev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <button onClick={goNext} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{label}</span>
        <div className="flex rounded-lg border overflow-hidden text-sm flex-shrink-0">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 ${view === 'month' ? 'bg-ocean-dark text-white' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            월
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 border-l ${view === 'week' ? 'bg-ocean-dark text-white' : 'hover:bg-gray-50 text-gray-600'}`}
          >
            주
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      {view === 'month' ? (
        <MonthView
          year={anchor.getFullYear()}
          month={anchor.getMonth()}
          todayKey={todayKey}
          events={events}
          onDayClick={date => setModal({ date })}
          onEventClick={ev => setModal({ date: ev.date, event: ev })}
        />
      ) : (
        <WeekView
          anchor={anchor}
          todayKey={todayKey}
          events={events}
          onSlotClick={(date, time) => setModal({ date, initTime: time })}
          onEventClick={ev => setModal({ date: ev.date, event: ev })}
        />
      )}

      {/* FAB */}
      <button
        onClick={() => setModal({ date: todayKey })}
        className="absolute bottom-4 right-4 w-14 h-14 bg-ocean-dark text-white rounded-full shadow-lg flex items-center justify-center text-3xl leading-none hover:bg-ocean-mid active:scale-95 transition-all z-10"
        aria-label="새 일정 추가"
      >
        +
      </button>

      {/* 이벤트 모달 */}
      {modal && (
        <EventModal
          state={modal}
          onSave={handleSave}
          onDelete={modal.event ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

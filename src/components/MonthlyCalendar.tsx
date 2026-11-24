'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
} from 'lucide-react';
import {
  AREA_OPTIONS,
  type AreaId,
  type Gym,
  type ScheduleEvent,
  type ScheduleEventType,
} from '@/lib/schema';
import { buildMonthCalendar } from '@/lib/calendar';
import {
  formatDateJa,
  formatDateRangeJa,
  getConfidenceLabel,
  getEventTypeMeta,
} from '@/lib/ui-helpers';

interface MonthlyCalendarProps {
  gyms: Gym[];
  events: ScheduleEvent[];
  todayStr: string;
  favorites: Set<string>;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const TYPE_FILTER_OPTIONS: { type: ScheduleEventType; label: string }[] = [
  { type: 'hold_change_full', label: '全面ホールド替え休業' },
  { type: 'closed', label: '臨時休業' },
  { type: 'hold_change_partial', label: '一部壁ホールド替え' },
  { type: 'hours_change', label: '時短・特別営業' },
  { type: 'event', label: 'イベント・コンペ' },
];

export function MonthlyCalendar({
  gyms,
  events,
  todayStr,
  favorites,
}: MonthlyCalendarProps) {
  const [todayYear, todayMonth] = todayStr.split('-').map(Number);
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaId | 'all'>('all');
  const [selectedTypes, setSelectedTypes] = useState<Set<ScheduleEventType>>(new Set());

  const gymMap = useMemo(() => new Map(gyms.map((g) => [g.id, g])), [gyms]);

  const cells = useMemo(() => {
    return buildMonthCalendar(year, month, gyms, events, {
      todayStr,
      gymIds: onlyFavorites ? Array.from(favorites) : undefined,
      areas: selectedArea === 'all' ? undefined : [selectedArea],
      types: selectedTypes.size > 0 ? Array.from(selectedTypes) : undefined,
    });
  }, [year, month, gyms, events, todayStr, onlyFavorites, favorites, selectedArea, selectedTypes]);

  const selectedCell = useMemo(
    () => cells.find((c) => c.dateStr === selectedDate),
    [cells, selectedDate],
  );

  // Deduplicated list of events intersecting this month (for easy mobile browsing)
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthStart = `${monthPrefix}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${monthPrefix}-${String(lastDay).padStart(2, '0')}`;

  const monthEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (ev.endDate < monthStart || ev.startDate > monthEnd) return false;
        const gym = gymMap.get(ev.gymId);
        if (!gym) return false;
        if (onlyFavorites && !favorites.has(ev.gymId)) return false;
        if (selectedArea !== 'all' && gym.area !== selectedArea) return false;
        if (selectedTypes.size > 0 && !selectedTypes.has(ev.type)) return false;
        return true;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, monthStart, monthEnd, gymMap, onlyFavorites, favorites, selectedArea, selectedTypes]);

  const goPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setYear(todayYear);
    setMonth(todayMonth);
    setSelectedDate(todayStr);
  };

  const toggleType = (type: ScheduleEventType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <section className="space-y-4">
      {/* Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="前の月"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="min-w-[120px] text-center text-lg font-bold text-slate-900">
              {year}年 {month}月
            </h2>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="次の月"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="ml-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              今月
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value as AreaId | 'all')}
              aria-label="エリアで絞り込み"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value="all">全エリア</option>
              {AREA_OPTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                onlyFavorites
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
              お気に入りのみ ({favorites.size})
            </button>
          </div>
        </div>

        {/* Event Type Legend / Toggle Filters */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {TYPE_FILTER_OPTIONS.map(({ type, label }) => {
            const meta = getEventTypeMeta(type);
            const active = selectedTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-slate-900 text-white ring-2 ring-slate-900/20'
                    : selectedTypes.size === 0
                      ? meta.pillClass
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : meta.dotClass}`} />
                {label}
              </button>
            );
          })}
          {selectedTypes.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTypes(new Set())}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 underline hover:text-slate-800"
            >
              フィルタ解除
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Calendar Grid + Selected Day Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:col-span-2">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-2 ${
                  idx === 0
                    ? 'text-rose-600'
                    : idx === 6
                      ? 'text-blue-600'
                      : 'text-slate-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {cells.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`flex min-h-[76px] flex-col items-start p-1.5 text-left transition-colors sm:min-h-[104px] sm:p-2 ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/70 text-slate-400'
                      : 'bg-white hover:bg-slate-50'
                  } ${isSelected ? 'ring-2 ring-inset ring-slate-900 bg-slate-50/80' : ''}`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        cell.isToday
                          ? 'bg-slate-900 text-white'
                          : cell.isHoliday || cell.dayOfWeek === 0
                            ? 'text-rose-600'
                            : cell.dayOfWeek === 6
                              ? 'text-blue-600'
                              : 'text-slate-700'
                      }`}
                    >
                      {cell.dayOfMonth}
                    </span>
                    {cell.holidayName && (
                      <span className="hidden truncate text-[9px] font-medium text-rose-500 sm:inline">
                        {cell.holidayName}
                      </span>
                    )}
                  </div>

                  {/* Mobile dots */}
                  <div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                    {cell.items.slice(0, 5).map((item) => (
                      <span
                        key={item.event.id}
                        className={`h-2 w-2 rounded-full ${getEventTypeMeta(item.event.type).dotClass}`}
                      />
                    ))}
                  </div>

                  {/* Desktop pills */}
                  <div className="mt-1 hidden w-full space-y-1 sm:block">
                    {cell.items.slice(0, 3).map((item) => {
                      const meta = getEventTypeMeta(item.event.type);
                      return (
                        <div
                          key={item.event.id}
                          className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.pillClass}`}
                          title={`${item.gymName}: ${item.event.title}`}
                        >
                          {item.gymName}
                        </div>
                      );
                    })}
                    {cell.items.length > 3 && (
                      <div className="px-1 text-[10px] font-semibold text-slate-500">
                        +{cell.items.length - 3}件
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {formatDateJa(selectedDate)} の予定
              </h3>
              {selectedCell?.holidayName && (
                <p className="text-xs font-medium text-rose-600">{selectedCell.holidayName}</p>
              )}
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {selectedCell?.items.length ?? 0}件
            </span>
          </div>

          {!selectedCell || selectedCell.items.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              この日に登録されているホールド替え・休業・イベント情報はありません。
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {selectedCell.items.map(({ event, gymName }) => {
                const meta = getEventTypeMeta(event.type);
                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border p-3 text-xs ${meta.cardClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{gymName}</span>
                      <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold">
                        {meta.shortLabel}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold">{event.title}</p>
                    <p className="mt-0.5 text-[11px] opacity-80">
                      期間: {formatDateRangeJa(event.startDate, event.endDate)}
                    </p>
                    {event.description && (
                      <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between text-[10px] opacity-75">
                      <span>
                        {event.source.label} ({getConfidenceLabel(event.source.confidence)})
                      </span>
                      <a
                        href={event.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-semibold underline"
                      >
                        元ページ <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Chronological Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">
          {year}年{month}月のホールド替え・休業・イベント一覧（{monthEvents.length}件）
        </h3>
        {monthEvents.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            この月の該当予定はまだ登録されていません。
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {monthEvents.map((ev) => {
              const gym = gymMap.get(ev.gymId);
              const meta = getEventTypeMeta(ev.type);
              return (
                <li
                  key={ev.id}
                  className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        {formatDateRangeJa(ev.startDate, ev.endDate)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.pillClass}`}>
                        {meta.shortLabel}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{gym?.name}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-700">{ev.title}</p>
                  </div>
                  <a
                    href={ev.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 sm:self-center"
                  >
                    公式確認 <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

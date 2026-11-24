'use client';

import { useMemo, useState } from 'react';
import { Calendar, Filter, Search, Star } from 'lucide-react';
import { AREA_OPTIONS, type AreaId, type Gym, type ScheduleEvent } from '@/lib/schema';
import {
  addDaysToDateStr,
  evaluateGymDayStatus,
  getJapaneseHolidayName,
} from '@/lib/schedule';
import { formatDateJa, getStatusMeta } from '@/lib/ui-helpers';
import { GymCard } from './GymCard';

interface TodayGymListProps {
  gyms: Gym[];
  events: ScheduleEvent[];
  now: Date;
  todayStr: string;
  favorites: Set<string>;
  onToggleFavorite: (gymId: string) => void;
}

export function TodayGymList({
  gyms,
  events,
  now,
  todayStr,
  favorites,
  onToggleFavorite,
}: TodayGymListProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedArea, setSelectedArea] = useState<AreaId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [excludeClosed, setExcludeClosed] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const isViewingToday = selectedDate === todayStr;
  const holidayName = getJapaneseHolidayName(selectedDate);

  const evaluatedAll = useMemo(() => {
    return gyms.map((gym) => evaluateGymDayStatus(gym, selectedDate, events, now));
  }, [gyms, selectedDate, events, now]);

  const summary = useMemo(() => {
    let openNow = 0;
    let holdChangeOrAlert = 0;
    let closedAllDay = 0;
    for (const item of evaluatedAll) {
      if (
        item.status === 'open' ||
        item.status === 'closing_soon' ||
        item.status === 'scheduled_open'
      ) {
        openNow += 1;
      }
      if (item.status === 'hold_change_closed' || item.status === 'temp_closed') {
        closedAllDay += 1;
        holdChangeOrAlert += 1;
      } else if (item.hasPartialHoldChange || item.isSpecialHours || item.hasEvent) {
        holdChangeOrAlert += 1;
      }
    }
    return { openNow, holdChangeOrAlert, closedAllDay };
  }, [evaluatedAll]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return evaluatedAll
      .filter((item) => {
        if (onlyFavorites && !favorites.has(item.gym.id)) return false;
        if (selectedArea !== 'all' && item.gym.area !== selectedArea) return false;
        if (
          onlyOpenNow &&
          isViewingToday &&
          item.status !== 'open' &&
          item.status !== 'closing_soon'
        ) {
          return false;
        }
        if (
          excludeClosed &&
          (item.status === 'hold_change_closed' ||
            item.status === 'temp_closed' ||
            item.status === 'regular_closed')
        ) {
          return false;
        }
        if (q) {
          const hay = `${item.gym.name} ${item.gym.chain ?? ''} ${item.gym.nearestStation} ${item.gym.address}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const favA = favorites.has(a.gym.id) ? 0 : 1;
        const favB = favorites.has(b.gym.id) ? 0 : 1;
        if (favA !== favB) return favA - favB;

        const wA = getStatusMeta(a.status).sortWeight;
        const wB = getStatusMeta(b.status).sortWeight;
        if (wA !== wB) return wA - wB;

        return a.gym.name.localeCompare(b.gym.name, 'ja');
      });
  }, [
    evaluatedAll,
    onlyFavorites,
    favorites,
    selectedArea,
    onlyOpenNow,
    isViewingToday,
    excludeClosed,
    searchQuery,
  ]);

  const tomorrowStr = addDaysToDateStr(todayStr, 1);
  const dayAfterStr = addDaysToDateStr(todayStr, 2);

  return (
    <section className="space-y-4">
      {/* Date Selector + Quick Stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                selectedDate === todayStr
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              今日 {formatDateJa(todayStr)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                selectedDate === tomorrowStr
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              明日 {formatDateJa(tomorrowStr)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(dayAfterStr)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                selectedDate === dayAfterStr
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              明後日 {formatDateJa(dayAfterStr)}
            </button>
            <label className="relative inline-flex items-center">
              <Calendar className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                aria-label="日付を選択"
                className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-sm font-medium text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </label>
            {holidayName && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                祝日: {holidayName}
              </span>
            )}
          </div>

          {/* Mini KPI summary */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isViewingToday ? '現在営業中' : '営業予定'}:{' '}
              <strong className="text-sm">{summary.openNow}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1 text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              ホールド替え・予定あり:{' '}
              <strong className="text-sm">{summary.holdChangeOrAlert}</strong>
            </span>
            {summary.closedAllDay > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">
                終日休業: <strong className="text-sm">{summary.closedAllDay}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Search + Quick Filter Toggles */}
        <div className="mt-3.5 flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ジム名・最寄り駅・チェーン名で検索（例: 荻窪、Dボル、調布...）"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isViewingToday && (
              <button
                type="button"
                onClick={() => setOnlyOpenNow((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                  onlyOpenNow
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                今開いている
              </button>
            )}
            <button
              type="button"
              onClick={() => setExcludeClosed((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                excludeClosed
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              休業を除外
            </button>
            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                onlyFavorites
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
              お気に入り ({favorites.size})
            </button>
          </div>
        </div>

        {/* Area Pills */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedArea('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              selectedArea === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全エリア ({gyms.length})
          </button>
          {AREA_OPTIONS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => setSelectedArea(area.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedArea === area.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">{filteredAndSorted.length}</strong> / {gyms.length} 店舗を表示
          {favorites.size > 0 && '（お気に入り店舗を上部に固定）'}
        </span>
      </div>

      {/* Gym Cards Grid */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">
            条件に一致するジムが見つかりませんでした
          </p>
          <p className="mt-1 text-xs text-slate-500">
            フィルタを解除するか、別のエリア・日付をお試しください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((item) => (
            <GymCard
              key={item.gym.id}
              dayStatus={item}
              isFavorite={favorites.has(item.gym.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}

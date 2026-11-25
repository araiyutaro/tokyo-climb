'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Calendar, Filter, Search, Star } from 'lucide-react';
import { AREA_OPTIONS, type AreaId, type Gym, type ScheduleEvent } from '@/lib/schema';
import {
  addDaysToDateStr,
  evaluateGymDayStatus,
  getJapaneseHolidayName,
  type GymDayStatus,
} from '@/lib/schedule';
import { formatDateJa, getStatusMeta } from '@/lib/ui-helpers';
import { GymCard } from './GymCard';

interface TodayGymListProps {
  gyms: Gym[];
  events: ScheduleEvent[];
  now: Date;
  todayStr: string;
  favorites: Set<string>;
  favoritesOnlyTab?: boolean;
  onToggleFavorite: (gymId: string) => void;
  onOpenGymDetail: (dayStatus: GymDayStatus) => void;
  onSwitchToAllTab?: () => void;
}

export function TodayGymList({
  gyms,
  events,
  now,
  todayStr,
  favorites,
  favoritesOnlyTab = false,
  onToggleFavorite,
  onOpenGymDetail,
  onSwitchToAllTab,
}: TodayGymListProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedArea, setSelectedArea] = useState<AreaId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [excludeClosed, setExcludeClosed] = useState(false);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState(false);
  const [sortMode, setSortMode] = useState<'status' | 'fresh_set'>('status');

  const effectiveOnlyFavorites = favoritesOnlyTab || onlyFavoritesFilter;
  const isViewingToday = selectedDate === todayStr;
  const holidayName = getJapaneseHolidayName(selectedDate);

  const evaluatedAll = useMemo(() => {
    return gyms.map((gym) => evaluateGymDayStatus(gym, selectedDate, events, now));
  }, [gyms, selectedDate, events, now]);

  const summarySource = useMemo(
    () =>
      favoritesOnlyTab
        ? evaluatedAll.filter((item) => favorites.has(item.gym.id))
        : evaluatedAll,
    [evaluatedAll, favoritesOnlyTab, favorites],
  );

  const summary = useMemo(() => {
    let openNow = 0;
    let holdChangeOrAlert = 0;
    let closedAllDay = 0;
    for (const item of summarySource) {
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
  }, [summarySource]);

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return evaluatedAll
      .filter((item) => {
        if (effectiveOnlyFavorites && !favorites.has(item.gym.id)) return false;
        if (!favoritesOnlyTab && selectedArea !== 'all' && item.gym.area !== selectedArea) {
          return false;
        }
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
          const hay =
            `${item.gym.name} ${item.gym.chain ?? ''} ${item.gym.nearestStation} ${item.gym.address}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const favA = favorites.has(a.gym.id) ? 0 : 1;
        const favB = favorites.has(b.gym.id) ? 0 : 1;
        if (favA !== favB) return favA - favB;

        if (sortMode === 'fresh_set') {
          const daysA = a.lastHoldChange?.daysAgo ?? Number.POSITIVE_INFINITY;
          const daysB = b.lastHoldChange?.daysAgo ?? Number.POSITIVE_INFINITY;
          if (daysA !== daysB) return daysA - daysB;
        }

        const wA = getStatusMeta(a.status).sortWeight;
        const wB = getStatusMeta(b.status).sortWeight;
        if (wA !== wB) return wA - wB;

        return a.gym.name.localeCompare(b.gym.name, 'ja');
      });
  }, [
    evaluatedAll,
    effectiveOnlyFavorites,
    favorites,
    favoritesOnlyTab,
    selectedArea,
    onlyOpenNow,
    isViewingToday,
    excludeClosed,
    searchQuery,
    sortMode,
  ]);

  const tomorrowStr = addDaysToDateStr(todayStr, 1);
  const dayAfterStr = addDaysToDateStr(todayStr, 2);

  // Dedicated empty onboarding state when on Favorites tab with 0 starred gyms
  if (favoritesOnlyTab && favorites.size === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
          <Star className="h-7 w-7 fill-amber-400" />
        </div>
        <h2 className="mt-4 text-base font-extrabold text-slate-900">
          よく行くジムをお気に入り登録しよう
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
          各ジムカードの右上の ★ をタップすると、このタブに普段通うジムだけを一瞬でまとめて表示できます。
        </p>
        {onSwitchToAllTab && (
          <button
            type="button"
            onClick={onSwitchToAllTab}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white active:scale-95"
          >
            全{gyms.length}店舗から選ぶ
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Date Selector + Quick Stats */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 sm:text-sm ${
                selectedDate === todayStr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              今日 {formatDateJa(todayStr)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 sm:text-sm ${
                selectedDate === tomorrowStr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              明日 {formatDateJa(tomorrowStr)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(dayAfterStr)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 sm:text-sm ${
                selectedDate === dayAfterStr
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              明後日 {formatDateJa(dayAfterStr)}
            </button>
            <label className="relative inline-flex shrink-0 items-center">
              <Calendar className="pointer-events-none absolute left-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                aria-label="日付を選択"
                className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs font-semibold text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none sm:text-sm"
              />
            </label>
            {holidayName && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                祝日: {holidayName}
              </span>
            )}
          </div>

          {/* Mini KPI summary */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
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
        <div className="mt-3 flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ジム名・最寄り駅・チェーンで検索（例: 三鷹、NOBOROCK...）"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[16px] text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none sm:text-sm"
            />
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {isViewingToday && (
              <button
                type="button"
                onClick={() => setOnlyOpenNow((v) => !v)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
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
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                excludeClosed
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              休業を除外
            </button>
            {!favoritesOnlyTab && (
              <button
                type="button"
                onClick={() => setOnlyFavoritesFilter((v) => !v)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  onlyFavoritesFilter
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${onlyFavoritesFilter ? 'fill-white' : ''}`} />
                お気に入り ({favorites.size})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSortMode((m) => (m === 'status' ? 'fresh_set' : 'status'))}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                sortMode === 'fresh_set'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="最後にホールド替えを行った日が新しい順に並べ替え"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortMode === 'fresh_set' ? 'セット新しい順' : '並び替え: 営業順'}
            </button>
          </div>
        </div>

        {/* Area Pills */}
        {!favoritesOnlyTab && (
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedArea('all')}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
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
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  selectedArea === area.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {area.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span>
          <strong className="text-slate-800">{filteredAndSorted.length}</strong> /{' '}
          {favoritesOnlyTab ? favorites.size : gyms.length} 店舗を表示
          {!favoritesOnlyTab && favorites.size > 0 && '（お気に入り店舗を上部に固定）'}
        </span>
        <span className="hidden text-[11px] text-slate-400 sm:inline">
          カードをタップで週間時間・詳細予定を表示
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
              onOpenDetail={onOpenGymDetail}
            />
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Flame,
  History,
  MapPin,
  Navigation,
  Star,
  X,
} from 'lucide-react';
import type { DayKey, ScheduleEvent } from '@/lib/schema';
import {
  formatMinutesToDuration,
  getDayKeyForDateStr,
  getUpcomingEventsForGym,
  type GymDayStatus,
} from '@/lib/schedule';
import { formatDistanceJa } from '@/lib/geo';
import { buildGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar-export';
import type { GymVisitSummary } from '@/lib/climb-log';
import {
  AREA_LABEL_MAP,
  DAY_LABEL_JA,
  formatDateJa,
  formatDateRangeJa,
  formatTimeRange,
  getConfidenceLabel,
  getEventTypeMeta,
  getStatusMeta,
} from '@/lib/ui-helpers';

interface GymDetailSheetProps {
  dayStatus: GymDayStatus | null;
  todayStr: string;
  distanceKm?: number;
  allEvents: ScheduleEvent[];
  isFavorite: boolean;
  visitedToday: boolean;
  visitSummary?: GymVisitSummary;
  onLogVisit: (gymId: string, dateStr: string, note?: string) => void;
  onToggleFavorite: (gymId: string) => void;
  onClose: () => void;
}

const WEEK_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

export function GymDetailSheet({
  dayStatus,
  todayStr,
  distanceKm,
  allEvents,
  isFavorite,
  visitedToday,
  visitSummary,
  onLogVisit,
  onToggleFavorite,
  onClose,
}: GymDetailSheetProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [visitNote, setVisitNote] = useState('');

  // Close on Escape and lock background scroll while open
  useEffect(() => {
    setVisitNote('');
    if (!dayStatus) {
      setDragY(0);
      setIsDragging(false);
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dayStatus, onClose]);

  if (!dayStatus) return null;

  const { gym, status, effectiveHours, isSpecialHours, lastHoldChange, dateStr, isHoliday } =
    dayStatus;
  const statusMeta = getStatusMeta(status);
  const activeDayKey: DayKey = isHoliday ? 'holiday' : getDayKeyForDateStr(dateStr);
  const upcoming60 = getUpcomingEventsForGym(gym.id, dateStr, allEvents, 60);

  const handleTouchStart = (e: React.TouchEvent, forceAllow = false) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, label')) {
      touchStartYRef.current = null;
      return;
    }
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    if (forceAllow || scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 10) {
      if (!isDragging) setIsDragging(true);
      setDragY(delta - 10);
    } else if (isDragging) {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;
    const elapsedMs = Math.max(1, Date.now() - touchStartTimeRef.current);
    const velocity = dragY / elapsedMs; // px per ms
    const finalDragY = dragY;
    touchStartYRef.current = null;
    setIsDragging(false);
    setDragY(0);

    if (finalDragY > 96 || (finalDragY > 40 && velocity > 0.45)) {
      onClose();
    }
  };

  const handleTouchCancel = () => {
    touchStartYRef.current = null;
    setIsDragging(false);
    setDragY(0);
  };

  const backdropOpacity = Math.max(0.15, 0.52 - dragY / 600);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gym-sheet-title"
      className="fixed inset-0 z-[1100] flex items-end justify-center backdrop-blur-[2px] animate-[fade-in_0.16s_ease-out] md:items-center md:p-6"
      style={{ backgroundColor: `rgba(2, 6, 23, ${backdropOpacity})` }}
      onClick={onClose}
    >
      <div
        className={`pb-safe relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-[sheet-up_0.22s_ease-out] dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 md:max-h-[85vh] md:rounded-3xl ${
          isDragging ? '' : 'transition-transform duration-200 ease-out'
        }`}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle + Header (always swipeable to close) */}
        <div
          onTouchStart={(e) => handleTouchStart(e, true)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div data-testid="sheet-drag-handle" className="flex justify-center pt-2.5 pb-1 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {gym.chain && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {gym.chain}
                  </span>
                )}
                <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200/80 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700">
                  {AREA_LABEL_MAP[gym.area]}
                </span>
                {gym.is24HoursForMembers && (
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                    会員24h対応
                  </span>
                )}
              </div>
              <h2
                id="gym-sheet-title"
                className="mt-1.5 text-lg font-extrabold text-slate-900 dark:text-white"
              >
                {gym.name}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {gym.nearestStation}
                </span>
                {distanceKm !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
                    現在地から {formatDistanceJa(distanceKm)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(gym.id);
                }}
                aria-label={isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}
                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 transition-colors active:scale-90 ${
                  isFavorite
                    ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/70'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                <Star className={`h-5 w-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>
              <button
                type="button"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="詳細を閉じる"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-slate-100 p-2.5 text-slate-600 transition-colors hover:bg-slate-200 active:scale-90 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content (also swipeable when scrolled to top) */}
        <div
          ref={scrollContainerRef}
          onTouchStart={(e) => handleTouchStart(e, false)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        >
          {/* Status Hero */}
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 dark:bg-slate-800/70 dark:ring-slate-700/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusMeta.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                {dayStatus.minutesUntilClose !== undefined && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    あと{formatMinutesToDuration(dayStatus.minutesUntilClose)}
                  </span>
                )}
                {dayStatus.minutesUntilOpen !== undefined && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    開店まで{formatMinutesToDuration(dayStatus.minutesUntilOpen)}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {formatDateJa(dateStr)}
                {dayStatus.holidayName ? ` · ${dayStatus.holidayName}` : ''}
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-slate-400" />
              <span className={isSpecialHours ? 'text-indigo-700 dark:text-indigo-300' : ''}>
                {effectiveHours
                  ? formatTimeRange(effectiveHours)
                  : status === 'regular_closed'
                    ? '定休日'
                    : '終日休業'}
              </span>
              {isSpecialHours && (
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  特別営業時間
                </span>
              )}
            </div>

            {gym.memberHoursNote && (
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                ※ {gym.memberHoursNote}
              </p>
            )}
            {gym.notes && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                注記: {gym.notes}
              </p>
            )}
          </div>

          {/* Climb Visit Check-in Card */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 dark:border-emerald-900/70 dark:bg-emerald-950/35">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                <Flame className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                登攀ログ
                {visitSummary && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-slate-900/70 dark:text-emerald-300">
                    累計 {visitSummary.count}回 · 前回{' '}
                    {visitSummary.daysAgo === 0
                      ? '本日'
                      : visitSummary.daysAgo === 1
                        ? '昨日'
                        : `${visitSummary.daysAgo}日前`}
                  </span>
                )}
              </div>
              {visitedToday && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  本日記録済み
                </span>
              )}
            </div>

            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={visitNote}
                onChange={(e) => setVisitNote(e.target.value)}
                placeholder="一言メモ（任意 例: 3級2本完登！）"
                className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[16px] text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none dark:border-emerald-800/80 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 sm:text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  onLogVisit(gym.id, todayStr, visitNote);
                  setVisitNote('');
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-800 active:scale-95"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {visitedToday ? 'メモ更新' : '今日登った！'}
              </button>
            </div>
          </div>

          {/* Last Hold Change */}
          <div
            className={`rounded-2xl p-3.5 text-xs ${
              lastHoldChange && lastHoldChange.daysAgo <= 7
                ? 'bg-teal-50 text-teal-950 ring-1 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800'
                : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <History className="h-4 w-4" />
                最終ホールド替え
              </span>
              {lastHoldChange && lastHoldChange.daysAgo <= 7 && (
                <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white">
                  NEWセット
                </span>
              )}
            </div>
            {lastHoldChange ? (
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold">
                    {formatDateJa(lastHoldChange.date)}（
                    {lastHoldChange.daysAgo === 0
                      ? '本日'
                      : lastHoldChange.daysAgo === 1
                        ? '昨日'
                        : `${lastHoldChange.daysAgo}日前`}
                    ）
                  </span>
                  <p className="mt-0.5 opacity-90">{lastHoldChange.title}</p>
                </div>
                {lastHoldChange.sourceUrl && (
                  <a
                    href={lastHoldChange.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold underline"
                  >
                    元記事 <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                まだホールド替え履歴が取得されていません（公式・Instaをご確認ください）。
              </p>
            )}
          </div>

          {/* Upcoming 60-day schedule events */}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              今後のホールド替え・休業・イベント（60日先まで · {upcoming60.length}件）
            </h3>
            {upcoming60.length === 0 ? (
              <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                現在登録されている今後のホールド替え・休業予定はありません。
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {upcoming60.map((ev) => {
                  const meta = getEventTypeMeta(ev.type);
                  return (
                    <div key={ev.id} className={`rounded-xl border p-3 text-xs ${meta.cardClass}`}>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 font-bold">
                          {(ev.type === 'hold_change_full' ||
                            ev.type === 'hold_change_partial' ||
                            ev.type === 'closed') && <AlertTriangle className="h-3.5 w-3.5" />}
                          {formatDateRangeJa(ev.startDate, ev.endDate)}
                        </span>
                        <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-900 dark:bg-slate-900/70 dark:text-slate-100">
                          {meta.shortLabel}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold">{ev.title}</p>
                      {ev.description && (
                        <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                          {ev.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="opacity-80">
                          {ev.source.label} ({getConfidenceLabel(ev.source.confidence)})
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href={buildGoogleCalendarUrl(gym, ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[28px] items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/10 hover:bg-white dark:bg-slate-900/75 dark:text-slate-100"
                          >
                            <CalendarPlus className="h-3 w-3" />
                            Googleカレンダー
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadIcsFile(gym, ev)}
                            className="inline-flex min-h-[28px] items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/10 hover:bg-white dark:bg-slate-900/75 dark:text-slate-100"
                          >
                            <Download className="h-3 w-3" />
                            .ics
                          </button>
                          <a
                            href={ev.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[28px] items-center gap-0.5 px-1.5 py-1 font-bold underline"
                          >
                            元ページ <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Hours Table */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              通常営業時間
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
              {WEEK_ORDER.map((dk) => {
                const isTodayRow = dk === activeDayKey;
                return (
                  <div
                    key={dk}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                      isTodayRow
                        ? 'bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{DAY_LABEL_JA[dk]}</span>
                    <span>{formatTimeRange(gym.regularHours[dk])}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Address & Big Action Buttons */}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">住所: {gym.address}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <a
                href={gym.links.scheduleUrl ?? gym.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-3 text-xs font-bold text-white transition-transform active:scale-95 dark:bg-white dark:text-slate-900"
              >
                公式サイト <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {gym.links.instagram && (
                <a
                  href={gym.links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-pink-600 px-3 py-3 text-xs font-bold text-white transition-transform active:scale-95"
                >
                  Insta を開く <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {gym.links.googleMaps && (
                <a
                  href={gym.links.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 px-3 py-3 text-xs font-bold text-blue-700 ring-1 ring-blue-200 transition-transform active:scale-95 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Googleマップ
                </a>
              )}
              {gym.links.x && (
                <a
                  href={gym.links.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-800 ring-1 ring-slate-200 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                >
                  公式 X <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Star,
} from 'lucide-react';
import { formatMinutesToDuration, type GymDayStatus } from '@/lib/schedule';
import { formatDistanceJa } from '@/lib/geo';
import type { GymVisitSummary } from '@/lib/climb-log';
import {
  AREA_LABEL_MAP,
  formatDateJa,
  formatDateRangeJa,
  formatTimeRange,
  getConfidenceLabel,
  getEventTypeMeta,
  getStatusMeta,
} from '@/lib/ui-helpers';

interface GymCardProps {
  dayStatus: GymDayStatus;
  distanceKm?: number;
  visitSummary?: GymVisitSummary;
  isFavorite: boolean;
  onToggleFavorite: (gymId: string) => void;
  onOpenDetail: (dayStatus: GymDayStatus) => void;
}

export function GymCard({
  dayStatus,
  distanceKm,
  visitSummary,
  isFavorite,
  onToggleFavorite,
  onOpenDetail,
}: GymCardProps) {
  const {
    gym,
    status,
    effectiveHours,
    isSpecialHours,
    eventsOnDate,
    upcomingAlerts,
    lastHoldChange,
  } = dayStatus;
  const statusMeta = getStatusMeta(status);

  const isClosedDay =
    status === 'hold_change_closed' ||
    status === 'temp_closed' ||
    status === 'regular_closed';

  return (
    <article
      onClick={() => onOpenDetail(dayStatus)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(dayStatus);
        }
      }}
      className={`gym-card-cv group relative flex cursor-pointer flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md active:scale-[0.985] dark:bg-slate-900/95 ${
        status === 'hold_change_closed' || status === 'temp_closed'
          ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/70 dark:bg-rose-950/20'
          : dayStatus.hasPartialHoldChange
            ? 'border-orange-200 dark:border-orange-900/70'
            : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      <div>
        {/* Top Row: Name + Favorite */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {gym.chain && (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {gym.chain}
                </span>
              )}
              <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700/80">
                {AREA_LABEL_MAP[gym.area]}
              </span>
              {gym.is24HoursForMembers && (
                <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-600/20 dark:bg-teal-950/70 dark:text-teal-300 dark:ring-teal-700/50">
                  会員24h対応
                </span>
              )}
              {visitSummary && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-600/20 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-700/50">
                  訪問{visitSummary.count}回
                </span>
              )}
            </div>
            <h2 className="mt-1.5 text-base font-bold tracking-tight text-slate-900 dark:text-white">
              {gym.name}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{gym.nearestStation}</span>
              </span>
              {distanceKm !== undefined && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-800/70">
                  約{formatDistanceJa(distanceKm)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(gym.id);
            }}
            aria-label={isFavorite ? `${gym.name}のお気に入りを解除` : `${gym.name}をお気に入りに追加`}
            className={`shrink-0 rounded-full p-2.5 transition-all active:scale-90 ${
              isFavorite
                ? 'bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-950/70'
                : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400'
            }`}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Status & Business Hours Box */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-200/60 dark:bg-slate-800/70 dark:ring-slate-700/70">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>

            {dayStatus.minutesUntilClose !== undefined && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                あと{formatMinutesToDuration(dayStatus.minutesUntilClose)}
                {dayStatus.isFromPreviousBusinessDay ? '（深夜）' : ''}
              </span>
            )}
            {dayStatus.minutesUntilOpen !== undefined && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                開店まで{formatMinutesToDuration(dayStatus.minutesUntilOpen)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            <Clock className="h-4 w-4 text-slate-400" />
            <span
              className={
                isSpecialHours
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : isClosedDay
                    ? 'text-rose-700 dark:text-rose-300'
                    : ''
              }
            >
              {effectiveHours
                ? formatTimeRange(effectiveHours)
                : status === 'regular_closed'
                  ? '定休日'
                  : '終日休業'}
            </span>
            {isSpecialHours && (
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                特別
              </span>
            )}
          </div>
        </div>

        {/* Last Hold Change Info */}
        <div
          className={`mt-2.5 flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-[11px] ${
            lastHoldChange && lastHoldChange.daysAgo <= 7
              ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200/80 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800/70'
              : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-800'
          }`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <History className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
            {lastHoldChange ? (
              <span className="truncate" title={`${lastHoldChange.date} ${lastHoldChange.title}`}>
                最終セット:{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {formatDateJa(lastHoldChange.date)}
                </strong>
                <span className="ml-1 text-slate-700 dark:text-slate-300">
                  (
                  {lastHoldChange.daysAgo === 0
                    ? '本日'
                    : lastHoldChange.daysAgo === 1
                      ? '昨日'
                      : `${lastHoldChange.daysAgo}日前`}
                  )
                </span>
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">最終セット: 情報収集中</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {lastHoldChange && lastHoldChange.daysAgo <= 7 && (
              <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
            )}
          </div>
        </div>

        {gym.memberHoursNote && (
          <p className="mt-2 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
            ※ {gym.memberHoursNote}
          </p>
        )}

        {/* Active Events / Hold Changes on Selected Date */}
        {eventsOnDate.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {eventsOnDate.map((ev) => {
              const meta = getEventTypeMeta(ev.type);
              return (
                <div key={ev.id} className={`rounded-xl border p-2.5 text-xs ${meta.cardClass}`}>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="inline-flex items-center gap-1 font-bold">
                      {(ev.type === 'hold_change_full' ||
                        ev.type === 'hold_change_partial' ||
                        ev.type === 'closed') && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                      {ev.title}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {formatDateRangeJa(ev.startDate, ev.endDate)}
                    </span>
                  </div>
                  {ev.affectedAreas && ev.affectedAreas.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {ev.affectedAreas.map((area) => (
                        <span
                          key={area}
                          className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900 ring-1 ring-black/10 dark:bg-slate-900/70 dark:text-slate-100"
                        >
                          制限: {area}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <span className="opacity-85">
                      {ev.source.label} ({getConfidenceLabel(ev.source.confidence)})
                    </span>
                    <a
                      href={ev.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-md bg-white/75 px-2 py-1 text-[11px] font-semibold underline hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900"
                    >
                      元ページ <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming 30-day Alerts */}
        {upcomingAlerts.length > 0 && (
          <div className="mt-2.5 rounded-xl bg-amber-50/80 px-2.5 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/60">
            <div className="flex items-center justify-between gap-1 font-semibold text-amber-800 dark:text-amber-300">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                直近1ヶ月以内の予定
              </span>
              {upcomingAlerts.length > 2 && (
                <span className="text-[10px] font-bold">全{upcomingAlerts.length}件</span>
              )}
            </div>
            <ul className="mt-1 space-y-0.5">
              {upcomingAlerts.slice(0, 2).map((ev) => (
                <li key={ev.id} className="truncate">
                  <span className="font-semibold">
                    {formatDateRangeJa(ev.startDate, ev.endDate)}
                  </span>{' '}
                  {ev.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer: Quick external links + Detail cue */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white">
          詳細・週間時間
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>

        <div
          className="flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={gym.links.scheduleUrl ?? gym.links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            公式 <ExternalLink className="h-3 w-3" />
          </a>
          {gym.links.instagram && (
            <a
              href={gym.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2.5 py-1.5 text-[11px] font-semibold text-pink-700 transition-colors hover:bg-pink-100 active:scale-95 dark:bg-pink-950/60 dark:text-pink-300 dark:hover:bg-pink-900/60"
              title="公式Instagramで最新ストーリー・ホールド替え情報を確認"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              Insta
            </a>
          )}
          {gym.links.x && (
            <a
              href={gym.links.x}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700 active:scale-95 dark:bg-slate-800 dark:text-slate-100 dark:ring-1 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              X
            </a>
          )}
          {gym.links.googleMaps && (
            <a
              href={gym.links.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 active:scale-95 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
            >
              地図
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

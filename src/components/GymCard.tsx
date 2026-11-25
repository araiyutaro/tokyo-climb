'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Star,
} from 'lucide-react';
import type { DayKey } from '@/lib/schema';
import { formatMinutesToDuration, type GymDayStatus } from '@/lib/schedule';
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

interface GymCardProps {
  dayStatus: GymDayStatus;
  isFavorite: boolean;
  onToggleFavorite: (gymId: string) => void;
}

const WEEK_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

export function GymCard({ dayStatus, isFavorite, onToggleFavorite }: GymCardProps) {
  const [showWeekly, setShowWeekly] = useState(false);
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
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md ${
        status === 'hold_change_closed' || status === 'temp_closed'
          ? 'border-rose-200 bg-rose-50/20'
          : dayStatus.hasPartialHoldChange
            ? 'border-orange-200'
            : 'border-slate-200/90'
      }`}
    >
      <div>
        {/* Top Row: Name + Favorite */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {gym.chain && (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {gym.chain}
                </span>
              )}
              <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200/70">
                {AREA_LABEL_MAP[gym.area]}
              </span>
              {gym.is24HoursForMembers && (
                <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-teal-600/20">
                  会員24h対応
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-base font-bold tracking-tight text-slate-900">
              {gym.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{gym.nearestStation}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(gym.id)}
            aria-label={isFavorite ? `${gym.name}のお気に入りを解除` : `${gym.name}をお気に入りに追加`}
            className={`shrink-0 rounded-full p-2 transition-colors ${
              isFavorite
                ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
            }`}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Status & Business Hours Box */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-200/60">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>

            {dayStatus.minutesUntilClose !== undefined && (
              <span className="text-xs font-medium text-slate-600">
                あと{formatMinutesToDuration(dayStatus.minutesUntilClose)}
                {dayStatus.isFromPreviousBusinessDay ? '（深夜営業）' : ''}
              </span>
            )}
            {dayStatus.minutesUntilOpen !== undefined && (
              <span className="text-xs font-medium text-slate-600">
                開店まで{formatMinutesToDuration(dayStatus.minutesUntilOpen)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className={isSpecialHours ? 'text-indigo-700' : isClosedDay ? 'text-rose-700' : ''}>
              {effectiveHours ? formatTimeRange(effectiveHours) : status === 'regular_closed' ? '定休日' : '終日休業'}
            </span>
            {isSpecialHours && (
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                特別時間
              </span>
            )}
          </div>
        </div>

        {/* Last Hold Change Info */}
        <div
          className={`mt-2.5 flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-[11px] ${
            lastHoldChange && lastHoldChange.daysAgo <= 7
              ? 'bg-teal-50/90 text-teal-900 ring-1 ring-teal-200/80'
              : 'bg-slate-50/80 text-slate-600 ring-1 ring-slate-200/60'
          }`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <History className="h-3.5 w-3.5 shrink-0 opacity-70" />
            {lastHoldChange ? (
              <span className="truncate" title={`${lastHoldChange.date} ${lastHoldChange.title}`}>
                最終セット:{' '}
                <strong className="font-bold">
                  {formatDateJa(lastHoldChange.date)}
                </strong>
                <span className="ml-1 opacity-80">
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
              <span className="text-slate-400">最終セット: 情報収集中</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {lastHoldChange && lastHoldChange.daysAgo <= 7 && (
              <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
            )}
            {lastHoldChange?.sourceUrl && (
              <a
                href={lastHoldChange.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline opacity-75 hover:opacity-100"
                title={lastHoldChange.title}
              >
                詳細
              </a>
            )}
          </div>
        </div>

        {gym.memberHoursNote && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            ※ {gym.memberHoursNote}
          </p>
        )}

        {gym.notes && (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            注記: {gym.notes}
          </p>
        )}

        {/* Active Events / Hold Changes on Selected Date */}
        {eventsOnDate.length > 0 && (
          <div className="mt-3 space-y-2">
            {eventsOnDate.map((ev) => {
              const meta = getEventTypeMeta(ev.type);
              return (
                <div
                  key={ev.id}
                  className={`rounded-xl border p-2.5 text-xs ${meta.cardClass}`}
                >
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
                          className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-black/10"
                        >
                          制限: {area}
                        </span>
                      ))}
                    </div>
                  )}
                  {ev.description && (
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">{ev.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-75">
                    <span>
                      {ev.source.label} ({getConfidenceLabel(ev.source.confidence)})
                    </span>
                    <a
                      href={ev.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-semibold underline hover:opacity-100"
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
          <div className="mt-2.5 rounded-xl bg-amber-50/80 px-2.5 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200/80">
            <div className="flex items-center gap-1 font-semibold text-amber-800">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              直近1ヶ月以内の予定
            </div>
            <ul className="mt-1 space-y-0.5">
              {upcomingAlerts.map((ev) => (
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

      {/* Footer: Weekly hours toggle + quick external links */}
      <div className="mt-3.5 border-t border-slate-100 pt-3">
        {showWeekly && (
          <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600">
            {WEEK_ORDER.map((dk) => (
              <div key={dk} className="flex justify-between">
                <span className="font-semibold text-slate-500">{DAY_LABEL_JA[dk]}</span>
                <span>{formatTimeRange(gym.regularHours[dk])}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowWeekly((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            通常営業時間
            {showWeekly ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={gym.links.scheduleUrl ?? gym.links.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              公式 <ExternalLink className="h-3 w-3" />
            </a>
            {gym.links.instagram && (
              <a
                href={gym.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700 transition-colors hover:bg-pink-100"
                title="公式Instagramで最新ストーリー・ホールド替え情報を確認"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-slate-700"
              >
                X
              </a>
            )}
            {gym.links.googleMaps && (
              <a
                href={gym.links.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                地図
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

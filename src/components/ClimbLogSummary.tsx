'use client';

import { useState } from 'react';
import { Award, ChevronDown, ChevronUp, Flame, MapPin, Trash2 } from 'lucide-react';
import type { Gym } from '@/lib/schema';
import type { ClimbStats, ClimbVisit } from '@/lib/climb-log';
import { formatDateJa } from '@/lib/ui-helpers';

interface ClimbLogSummaryProps {
  visits: ClimbVisit[];
  stats: ClimbStats;
  gyms: Gym[];
  onDeleteVisit: (visitId: string) => void;
  onSelectGym: (gymId: string) => void;
}

export function ClimbLogSummary({
  visits,
  stats,
  gyms,
  onDeleteVisit,
  onSelectGym,
}: ClimbLogSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const gymMap = new Map(gyms.map((g) => [g.id, g]));

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            <Flame className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              マイ登攀ログ
            </h2>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              各ジム詳細シートの「今日登った！」から記録できます
            </p>
          </div>
        </div>

        {visits.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            履歴 ({visits.length})
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* KPI 3-column strip */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/70">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">今月</div>
          <div className="mt-0.5 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
            {stats.thisMonthCount}
            <span className="ml-0.5 text-xs font-bold">回</span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/70">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">累計</div>
          <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
            {stats.totalVisits}
            <span className="ml-0.5 text-xs font-bold">回</span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/70">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">制覇ジム</div>
          <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
            {stats.uniqueGymsCount}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              /{gyms.length}
            </span>
          </div>
        </div>
      </div>

      {/* Top visited gyms pills */}
      {stats.topGyms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            よく行く順:
          </span>
          {stats.topGyms.map((item) => {
            const gym = gymMap.get(item.gymId);
            if (!gym) return null;
            return (
              <button
                key={item.gymId}
                type="button"
                onClick={() => onSelectGym(item.gymId)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                {gym.shortName ?? gym.name}
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Expandable visit timeline */}
      {expanded && visits.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2 dark:divide-slate-800 dark:border-slate-800">
          {visits.slice(0, 20).map((v) => {
            const gym = gymMap.get(v.gymId);
            return (
              <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectGym(v.gymId)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      {formatDateJa(v.date)}
                    </span>
                    <span className="inline-flex items-center gap-1 truncate font-bold text-slate-900 dark:text-white">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      {gym?.name ?? v.gymId}
                    </span>
                  </div>
                  {v.note && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-400">
                      {v.note}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteVisit(v.id)}
                  aria-label="この記録を削除"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

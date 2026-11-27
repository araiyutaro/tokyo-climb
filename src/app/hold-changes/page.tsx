import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  ExternalLink,
  Flame,
  History,
  Mountain,
} from 'lucide-react';
import { loadDataset } from '@/lib/data';
import { getJstDateParts } from '@/lib/schedule';
import {
  buildBreadcrumbJsonLd,
  getRecentHoldChangeGyms,
  getUpcomingHoldChangeEvents,
} from '@/lib/seo';
import { buildGoogleCalendarUrl } from '@/lib/calendar-export';
import { getSiteUrl } from '@/lib/site';
import {
  AREA_LABEL_MAP,
  formatDateJa,
  formatDateRangeJa,
  getEventTypeMeta,
} from '@/lib/ui-helpers';
import { AdSlot } from '@/components/AdSlot';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '東京ボルダリング ホールド替え速報・今後のセット予定まとめ | Tokyo Climb',
  description:
    '東京・近郊の主要ボルダリングジム46店舗の「直近ホールド替えが終わった新課題ジム」と「今後60日以内のホールド替え・臨時休業予定」をリアルタイム横断で一覧表示します。',
  alternates: { canonical: '/hold-changes' },
};

export default function HoldChangesPage() {
  const dataset = loadDataset();
  const now = new Date();
  const jst = getJstDateParts(now);

  const recentSets = getRecentHoldChangeGyms(dataset.gyms, dataset.events, jst.dateStr, 45, now);
  const upcomingChanges = getUpcomingHoldChangeEvents(
    dataset.gyms,
    dataset.events,
    jst.dateStr,
    60,
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(getSiteUrl(), [
    { name: 'ホーム', path: '/' },
    { name: 'ホールド替え速報', path: '/hold-changes' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            トップへ戻る
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white"
          >
            <Mountain className="h-4 w-4" />
            Tokyo Climb
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
            <Flame className="h-3.5 w-3.5" />
            毎日6時間ごとに自動更新 · {formatDateJa(jst.dateStr)}
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            東京・近郊 ボルダリング ホールド替え速報＆予定一覧
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            「ホールド替え直後のフレッシュな課題が登りたい」「行く予定のジムがセット休業じゃないか事前に知りたい」というクライマー向けの横断レーダーです。
          </p>
        </section>

        {/* Section 1: Freshly Set Gyms */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
            <History className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            直近ホールド替え済みのジム（セットが新しい順 · {recentSets.length}店舗）
          </h2>
          {recentSets.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              直近45日以内のホールド替え履歴が登録された店舗はありません。
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {recentSets.map((ds) => {
                const hc = ds.lastHoldChange!;
                const isNew = hc.daysAgo <= 7;
                return (
                  <Link
                    key={ds.gym.id}
                    href={`/gyms/${ds.gym.id}`}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isNew
                        ? 'border-teal-200 bg-teal-50/70 hover:bg-teal-50 dark:border-teal-800/80 dark:bg-teal-950/40'
                        : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isNew && (
                            <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white">
                              NEWセット
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {AREA_LABEL_MAP[ds.gym.area]}
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                          {ds.gym.name}
                        </h3>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-teal-800 shadow-2xs dark:bg-slate-900 dark:text-teal-300">
                        {hc.daysAgo === 0 ? '本日' : hc.daysAgo === 1 ? '昨日' : `${hc.daysAgo}日前`}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {formatDateJa(hc.date)} · {hc.title}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {ds.gym.nearestStation}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <AdSlot variant="detail" />

        {/* Section 2: Upcoming 60-day Hold Changes & Closures */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
            <CalendarClock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            今後のホールド替え・臨時休業予定（60日先まで · {upcomingChanges.length}件）
          </h2>
          {upcomingChanges.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              現在登録されている今後のホールド替え・休業予定はありません。
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {upcomingChanges.map(({ gym, event }) => {
                const meta = getEventTypeMeta(event.type);
                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl border p-4 text-xs ${meta.cardClass}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-extrabold">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {formatDateRangeJa(event.startDate, event.endDate)}
                      </span>
                      <span className="rounded bg-white/85 px-2 py-0.5 text-[11px] font-bold text-slate-900 dark:bg-slate-900/75 dark:text-slate-100">
                        {meta.shortLabel}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                      <Link
                        href={`/gyms/${gym.id}`}
                        className="text-sm font-extrabold underline decoration-current/40 underline-offset-2 hover:opacity-80"
                      >
                        {gym.name}
                      </Link>
                      <span className="text-[11px] opacity-80">{AREA_LABEL_MAP[gym.area]}</span>
                    </div>
                    <p className="mt-1 font-semibold">{event.title}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                      <a
                        href={buildGoogleCalendarUrl(gym, event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2.5 py-1 font-semibold text-slate-800 ring-1 ring-black/10 hover:bg-white dark:bg-slate-900/75 dark:text-slate-100"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Googleカレンダーに追加
                      </a>
                      <a
                        href={event.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-bold underline"
                      >
                        公式ソース <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

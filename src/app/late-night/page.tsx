import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Moon, Mountain } from 'lucide-react';
import { loadDataset } from '@/lib/data';
import { evaluateGymDayStatus, getJstDateParts } from '@/lib/schedule';
import { buildBreadcrumbJsonLd, getLatestCloseTime, isLateNightOr24hGym } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';
import { AREA_LABEL_MAP, formatTimeRange, getStatusMeta } from '@/lib/ui-helpers';
import { AdSlot } from '@/components/AdSlot';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '東京の24時間営業・深夜営業ボルダリングジムまとめ | Tokyo Climb',
  description:
    '東京都内および近郊で23時以降・24時・26時まで営業している深夜営業ボルダリングジムと、会員24時間利用対応ジムを一覧でまとめました。仕事帰りや夜練のジム探しに最適です。',
  alternates: { canonical: '/late-night' },
};

export default function LateNightGymsPage() {
  const dataset = loadDataset();
  const now = new Date();
  const jst = getJstDateParts(now);

  const member24hGyms = dataset.gyms.filter((g) => g.is24HoursForMembers);
  const lateNightGyms = dataset.gyms
    .filter((g) => !g.is24HoursForMembers && isLateNightOr24hGym(g))
    .sort((a, b) => (getLatestCloseTime(b) ?? '').localeCompare(getLatestCloseTime(a) ?? ''));

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(getSiteUrl(), [
    { name: 'ホーム', path: '/' },
    { name: '深夜・24時間営業ジム', path: '/late-night' },
  ]);

  const renderCard = (gym: (typeof dataset.gyms)[number]) => {
    const ds = evaluateGymDayStatus(gym, jst.dateStr, dataset.events, now);
    const statusMeta = getStatusMeta(ds.status);
    const latestClose = getLatestCloseTime(gym);

    return (
      <Link
        key={gym.id}
        href={`/gyms/${gym.id}`}
        className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {AREA_LABEL_MAP[gym.area]}
                </span>
                {gym.is24HoursForMembers && (
                  <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                    会員24h対応
                  </span>
                )}
                {latestClose && (
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                    最遅 {latestClose} まで
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white">
                {gym.name}
              </h3>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusMeta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
              {statusMeta.label}
            </span>
          </div>

          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {gym.nearestStation}
          </p>

          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            本日: {ds.effectiveHours ? formatTimeRange(ds.effectiveHours) : '休業・定休日'}
          </p>

          {gym.memberHoursNote && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              ※ {gym.memberHoursNote}
            </p>
          )}
        </div>
      </Link>
    );
  };

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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
            <Moon className="h-3.5 w-3.5" />
            仕事帰り・夜練に強いジム特集
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            東京・近郊 24時間営業＆23時以降の深夜営業ボルダリングジム
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            残業後や早朝でも登れる会員24時間対応ジム（{member24hGyms.length}店舗）と、23:00以降まで営業している深夜営業ジム（{lateNightGyms.length}店舗）をまとめました。
          </p>
        </section>

        {member24hGyms.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              会員24時間営業対応のジム（{member24hGyms.length}店舗）
            </h2>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {member24hGyms.map(renderCard)}
            </div>
          </section>
        )}

        <AdSlot variant="detail" />

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            23:00以降まで営業しているジム（{lateNightGyms.length}店舗）
          </h2>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {lateNightGyms.map(renderCard)}
          </div>
        </section>
      </main>
    </div>
  );
}

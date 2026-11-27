import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Flame, History, MapPin, Mountain } from 'lucide-react';
import { loadDataset } from '@/lib/data';
import { AREA_OPTIONS, type AreaId } from '@/lib/schema';
import { evaluateGymDayStatus, getJstDateParts } from '@/lib/schedule';
import { AREA_SEO_META, buildBreadcrumbJsonLd, getAreaOptionById, isLateNightOr24hGym } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';
import { formatDateJa, formatTimeRange, getStatusMeta } from '@/lib/ui-helpers';
import { AdSlot } from '@/components/AdSlot';

export const revalidate = 300;

export function generateStaticParams() {
  return AREA_OPTIONS.map((a) => ({ area: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const opt = getAreaOptionById(area);
  if (!opt) {
    return { title: 'エリアが見つかりません | Tokyo Climb' };
  }
  const seo = AREA_SEO_META[opt.id];
  return {
    title: `${seo.title} | Tokyo Climb`,
    description: seo.description,
    alternates: { canonical: `/areas/${opt.id}` },
    openGraph: {
      title: `${seo.title} | Tokyo Climb`,
      description: seo.description,
      type: 'website',
      locale: 'ja_JP',
    },
  };
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  const opt = getAreaOptionById(area);
  if (!opt) notFound();

  const areaId: AreaId = opt.id;
  const seo = AREA_SEO_META[areaId];
  const dataset = loadDataset();
  const now = new Date();
  const jst = getJstDateParts(now);

  const areaGyms = dataset.gyms.filter((g) => g.area === areaId);
  const statuses = areaGyms
    .map((gym) => evaluateGymDayStatus(gym, jst.dateStr, dataset.events, now))
    .sort((a, b) => {
      const wA = getStatusMeta(a.status).sortWeight;
      const wB = getStatusMeta(b.status).sortWeight;
      if (wA !== wB) return wA - wB;
      return a.gym.name.localeCompare(b.gym.name, 'ja');
    });

  const openCount = statuses.filter(
    (s) => s.status === 'open' || s.status === 'closing_soon' || s.status === 'scheduled_open',
  ).length;
  const freshSetCount = statuses.filter(
    (s) => s.lastHoldChange && s.lastHoldChange.daysAgo <= 14,
  ).length;
  const lateNightCount = areaGyms.filter(isLateNightOr24hGym).length;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(getSiteUrl(), [
    { name: 'ホーム', path: '/' },
    { name: seo.label, path: `/areas/${areaId}` },
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
            全{dataset.gyms.length}店舗一覧へ
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

      <main className="mx-auto max-w-5xl space-y-5 px-4 pt-6 sm:px-6">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
            エリア別まとめ · {formatDateJa(jst.dateStr)}
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {seo.label}のボルダリングジム（{areaGyms.length}店舗）
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {seo.lead}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              本日営業: {openCount} / {areaGyms.length}店舗
            </span>
            <span className="rounded-xl bg-teal-50 px-3 py-1.5 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              直近2週間の新セット: {freshSetCount}店舗
            </span>
            <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              23時以降/24h対応: {lateNightCount}店舗
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {statuses.map((ds) => {
            const statusMeta = getStatusMeta(ds.status);
            return (
              <Link
                key={ds.gym.id}
                href={`/gyms/${ds.gym.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ds.gym.chain && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {ds.gym.chain}
                          </span>
                        )}
                        {ds.gym.is24HoursForMembers && (
                          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                            会員24h
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-base font-extrabold text-slate-900 group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-400">
                        {ds.gym.name}
                      </h2>
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
                    {ds.gym.nearestStation}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {ds.effectiveHours ? formatTimeRange(ds.effectiveHours) : '休業・定休日'}
                    </span>
                    {ds.lastHoldChange && (
                      <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300">
                        <History className="h-3.5 w-3.5" />
                        最終セット:{' '}
                        {ds.lastHoldChange.daysAgo === 0
                          ? '本日'
                          : `${ds.lastHoldChange.daysAgo}日前`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>週間営業時間・ホールド替え詳細を見る</span>
                  <span className="text-indigo-600 dark:text-indigo-400">→</span>
                </div>
              </Link>
            );
          })}
        </section>

        <AdSlot variant="detail" />

        {/* Cross-area navigation for internal linking */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            他のエリア・特集から探す
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {AREA_OPTIONS.filter((a) => a.id !== areaId).map((other) => (
              <Link
                key={other.id}
                href={`/areas/${other.id}`}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {other.label}
              </Link>
            ))}
            <Link
              href="/hold-changes"
              className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300"
            >
              <Flame className="h-3.5 w-3.5" />
              ホールド替え速報
            </Link>
            <Link
              href="/late-night"
              className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              深夜・24時間営業ジム
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

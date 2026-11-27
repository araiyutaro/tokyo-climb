import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CalendarPlus,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Mountain,
  Navigation,
} from 'lucide-react';
import { loadDataset } from '@/lib/data';
import type { DayKey } from '@/lib/schema';
import {
  evaluateGymDayStatus,
  formatMinutesToDuration,
  getDayKeyForDateStr,
  getJstDateParts,
  getUpcomingEventsForGym,
} from '@/lib/schedule';
import { formatDistanceJa } from '@/lib/geo';
import { buildGoogleCalendarUrl } from '@/lib/calendar-export';
import { getActivePromotions, loadPromotions } from '@/lib/promotions';
import { buildBreadcrumbJsonLd, buildGymShareText } from '@/lib/seo';
import { findNearbyGyms, getSiteUrl } from '@/lib/site';
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
import { AdSlot } from '@/components/AdSlot';
import { NativePromoCard } from '@/components/NativePromoCard';
import { ShareButton } from '@/components/ShareButton';

export const revalidate = 300;

const WEEK_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

export function generateStaticParams() {
  const { gyms } = loadDataset();
  return gyms.map((gym) => ({ id: gym.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { gyms } = loadDataset();
  const gym = gyms.find((g) => g.id === id);

  if (!gym) {
    return {
      title: 'ジムが見つかりません | Tokyo Climb',
    };
  }

  const areaLabel = AREA_LABEL_MAP[gym.area];
  const title = `${gym.name}の営業時間・ホールド替え・アクセス | Tokyo Climb`;
  const description = `${gym.name}（${gym.nearestStation}・${areaLabel}）の今日の営業時間、通常営業時間、最終ホールド替え日、今後のホールド替え・臨時休業スケジュール、周辺ボルダリングジム情報をまとめて確認できます。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/gyms/${gym.id}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'ja_JP',
    },
  };
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dataset = loadDataset();
  const gym = dataset.gyms.find((g) => g.id === id);

  if (!gym) {
    notFound();
  }

  const now = new Date();
  const jst = getJstDateParts(now);
  const dayStatus = evaluateGymDayStatus(gym, jst.dateStr, dataset.events, now);
  const statusMeta = getStatusMeta(dayStatus.status);
  const activeDayKey: DayKey = dayStatus.isHoliday
    ? 'holiday'
    : getDayKeyForDateStr(dayStatus.dateStr);
  const upcoming60 = getUpcomingEventsForGym(gym.id, jst.dateStr, dataset.events, 60);
  const nearbyGyms = findNearbyGyms(gym, dataset.gyms, 4);
  const sameChainGyms =
    gym.chain && gym.chain !== '独立系'
      ? dataset.gyms.filter((g) => g.chain === gym.chain && g.id !== gym.id)
      : [];

  const siteUrl = getSiteUrl();
  const detailPromos = getActivePromotions(loadPromotions(), 'detail', jst.dateStr);
  const detailPromo = detailPromos.length > 0 ? detailPromos[0] : null;
  const shareText = buildGymShareText(dayStatus);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(siteUrl, [
    { name: 'ホーム', path: '/' },
    { name: AREA_LABEL_MAP[gym.area], path: `/areas/${gym.area}` },
    { name: gym.name, path: `/gyms/${gym.id}` },
  ]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: gym.name,
    url: `${siteUrl}/gyms/${gym.id}`,
    sameAs: [gym.links.website, gym.links.instagram, gym.links.x].filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.address,
      addressRegion: gym.prefecture,
      addressCountry: 'JP',
    },
    ...(gym.coordinates
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: gym.coordinates.lat,
            longitude: gym.coordinates.lng,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            全{dataset.gyms.length}店舗一覧へ戻る
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

      <main className="mx-auto max-w-4xl space-y-5 px-4 pt-6 sm:px-6">
        {/* Hero Card */}
        <article className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {gym.chain && (
                <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {gym.chain}
                </span>
              )}
              <Link
                href={`/areas/${gym.area}`}
                className="rounded-md bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
              >
                {AREA_LABEL_MAP[gym.area]}
              </Link>
              {gym.is24HoursForMembers && (
                <span className="rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/70 dark:text-teal-300">
                  会員24h対応
                </span>
              )}
            </div>
            <ShareButton
              title={`${gym.name} | Tokyo Climb`}
              text={shareText}
              path={`/gyms/${gym.id}`}
            />
          </div>

          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {gym.name}
          </h1>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            {gym.nearestStation}（{gym.address}）
          </p>

          {/* Today Status */}
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 dark:bg-slate-800/70 dark:ring-slate-700/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusMeta.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                {dayStatus.minutesUntilClose !== undefined && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    閉店まであと{formatMinutesToDuration(dayStatus.minutesUntilClose)}
                  </span>
                )}
                {dayStatus.minutesUntilOpen !== undefined && (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    開店まで{formatMinutesToDuration(dayStatus.minutesUntilOpen)}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                本日 {formatDateJa(dayStatus.dateStr)}
                {dayStatus.holidayName ? ` · ${dayStatus.holidayName}` : ''}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
              <Clock className="h-5 w-5 text-slate-400" />
              <span className={dayStatus.isSpecialHours ? 'text-indigo-700 dark:text-indigo-300' : ''}>
                {dayStatus.effectiveHours
                  ? formatTimeRange(dayStatus.effectiveHours)
                  : dayStatus.status === 'regular_closed'
                    ? '定休日'
                    : '終日休業'}
              </span>
              {dayStatus.isSpecialHours && (
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
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                注記: {gym.notes}
              </p>
            )}
          </div>

          {/* Last Hold Change */}
          <section className="mt-5">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
              <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              最終ホールド替え情報
            </h2>
            <div
              className={`mt-2 rounded-2xl p-4 text-xs ${
                dayStatus.lastHoldChange && dayStatus.lastHoldChange.daysAgo <= 7
                  ? 'bg-teal-50 text-teal-950 ring-1 ring-teal-200 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800'
                  : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700/70'
              }`}
            >
              {dayStatus.lastHoldChange ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold">
                      {formatDateJa(dayStatus.lastHoldChange.date)}（
                      {dayStatus.lastHoldChange.daysAgo === 0
                        ? '本日'
                        : dayStatus.lastHoldChange.daysAgo === 1
                          ? '昨日'
                          : `${dayStatus.lastHoldChange.daysAgo}日前`}
                      ）
                    </p>
                    <p className="mt-1 opacity-90">{dayStatus.lastHoldChange.title}</p>
                  </div>
                  {dayStatus.lastHoldChange.sourceUrl && (
                    <a
                      href={dayStatus.lastHoldChange.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold underline"
                    >
                      公式記事を見る <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">
                  直近のホールド替え履歴は未登録です。最新のセット情報は下記の公式サイトや Instagram をご確認ください。
                </p>
              )}
            </div>
          </section>

          {/* Upcoming 60 Days */}
          <section className="mt-6">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
              <CalendarClock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              今後のホールド替え・休業・イベント予定（60日先まで · {upcoming60.length}件）
            </h2>
            {upcoming60.length === 0 ? (
              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                現在、60日先までに登録されているホールド替え・臨時休業予定はありません。
              </p>
            ) : (
              <div className="mt-2.5 space-y-2.5">
                {upcoming60.map((ev) => {
                  const meta = getEventTypeMeta(ev.type);
                  return (
                    <div key={ev.id} className={`rounded-2xl border p-3.5 text-xs ${meta.cardClass}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 font-bold">
                          {(ev.type === 'hold_change_full' ||
                            ev.type === 'hold_change_partial' ||
                            ev.type === 'closed') && <AlertTriangle className="h-3.5 w-3.5" />}
                          {formatDateRangeJa(ev.startDate, ev.endDate)}
                        </span>
                        <span className="rounded bg-white/85 px-2 py-0.5 text-[11px] font-bold text-slate-900 dark:bg-slate-900/75 dark:text-slate-100">
                          {meta.shortLabel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold">{ev.title}</p>
                      {ev.description && (
                        <p className="mt-1 leading-relaxed opacity-90">{ev.description}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="opacity-80">
                          情報元: {ev.source.label}（{getConfidenceLabel(ev.source.confidence)}）
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={buildGoogleCalendarUrl(gym, ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2.5 py-1 font-semibold text-slate-800 ring-1 ring-black/10 hover:bg-white dark:bg-slate-900/75 dark:text-slate-100"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            Googleカレンダーに追加
                          </a>
                          <a
                            href={ev.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 font-bold underline"
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
          </section>

          {/* Weekly Hours */}
          <section className="mt-6">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {gym.name}の通常営業時間
            </h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3.5 text-xs dark:bg-slate-800/60 sm:grid-cols-4">
              {WEEK_ORDER.map((dk) => {
                const isTodayRow = dk === activeDayKey;
                return (
                  <div
                    key={dk}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                      isTodayRow
                        ? 'bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700/70'
                    }`}
                  >
                    <span>{DAY_LABEL_JA[dk]}</span>
                    <span>{formatTimeRange(gym.regularHours[dk])}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Official Links */}
          <section className="mt-6">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              アクセス・公式リンク
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
              最寄り駅：{gym.nearestStation} ／ 住所：{gym.address}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                  Instagram <ExternalLink className="h-3.5 w-3.5" />
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
          </section>
        </article>

        {/* Native PR / Gear Card (hidden until affiliate/sponsor URL is set in data/promotions.json) */}
        <NativePromoCard item={detailPromo} />

        {/* Manual CLS-safe AdSense Slot (hidden until NEXT_PUBLIC_ADSENSE_* env vars are set) */}
        <AdSlot variant="detail" />

        {/* Nearby Gyms (great fallback when closed for hold-change + SEO internal links) */}
        {nearbyGyms.length > 0 && (
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {gym.name}の周辺にあるボルダリングジム
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ホールド替え休業や混雑時の候補としてチェックできる近隣店舗です。
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {nearbyGyms.map(({ gym: near, distanceKm }) => (
                <Link
                  key={near.id}
                  href={`/gyms/${near.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 transition-colors hover:border-slate-300 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {near.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {near.nearestStation}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
                    約 {formatDistanceJa(distanceKm)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Same Chain Gyms */}
        {sameChainGyms.length > 0 && (
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {gym.chain} の他店舗
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {sameChainGyms.map((peer) => (
                <Link
                  key={peer.id}
                  href={`/gyms/${peer.id}`}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {peer.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="font-bold text-slate-700 hover:underline dark:text-slate-300">
            ← Tokyo Climb トップ（リアルタイム営業一覧・マップ）
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline">
              このサイトについて
            </Link>
            <Link href="/privacy" className="hover:underline">
              プライバシーポリシー
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

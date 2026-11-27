import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Backpack, ExternalLink, Lightbulb, Mountain } from 'lucide-react';
import { getActivePromotions, loadPromotions } from '@/lib/promotions';
import { getJstDateParts } from '@/lib/schedule';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';
import { AdSlot } from '@/components/AdSlot';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '東京ボルダリング 定番ギア・消耗品ガイド（チョーク・ブラシ・ケア） | Tokyo Climb',
  description:
    '都内ボルダリングジム通いで本当に役立つ定番ギア＆消耗品（松脂不使用の液体チョーク・国産粉チョーク・豚毛ブラシ・テーピング・指皮ケア・1足目シューズ）の選び方まとめ。',
  alternates: { canonical: '/gear' },
};

export default function GearGuidePage() {
  const jst = getJstDateParts(new Date());
  const allPromotions = loadPromotions();
  const gearItems = getActivePromotions(allPromotions, 'gear', jst.dateStr);
  const hasAffiliateLinks = gearItems.some((item) => Boolean(item.affiliateUrl));

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(getSiteUrl(), [
    { name: 'ホーム', path: '/' },
    { name: '定番ギア・消耗品ガイド', path: '/gear' },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
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

      <main className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              <Backpack className="h-3.5 w-3.5" />
              クライマー持ち物チェック
            </span>
            {hasAffiliateLinks && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                ※本ページはプロモーション（PR）を含みます
              </span>
            )}
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            都内ボルダリングジム通いの定番ギア・消耗品ガイド
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            複数のジムを巡るクライマーが「これだけはバッグに入れておくと安心」と感じる消耗品とギアの選び方を厳選してまとめました。ホールド替え直後の高フリクション対策や、粉チョーク制限ジムへの遠征準備にもご活用ください。
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gearItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.badge}
                  </span>
                  {item.affiliateUrl && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                      PR
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  {item.subtitle}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>

                {item.tip && (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{item.tip}</span>
                  </div>
                )}
              </div>

              {item.affiliateUrl && (
                <div className="mt-4 pt-2">
                  <a
                    href={item.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-transform hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900"
                  >
                    {item.ctaLabel ?? '詳細を見る'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </section>

        <AdSlot variant="detail" />

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="font-bold text-slate-700 hover:underline dark:text-slate-300">
            ← 今日の営業ジム一覧を見る
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/hold-changes" className="hover:underline">
              ホールド替え速報
            </Link>
            <Link href="/late-night" className="hover:underline">
              深夜・24hジム
            </Link>
            <Link href="/about" className="hover:underline">
              このサイトについて
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, ExternalLink, MapPin, Mountain, RefreshCw } from 'lucide-react';
import { loadDataset } from '@/lib/data';

export const metadata: Metadata = {
  title: 'このサイトについて | Tokyo Climb',
  description:
    'Tokyo Climb の特徴、掲載対象ボルダリングジム、スケジュール自動収集の仕組み、掲載修正リクエストやお問い合わせ方法についてご紹介します。',
};

export default function AboutPage() {
  const dataset = loadDataset();

  return (
    <div className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            トップへ戻る
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white">
            <Mountain className="h-4 w-4" />
            Tokyo Climb
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-6 sm:px-6">
        <article className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">About Tokyo Climb</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tokyo Climb について
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <strong>Tokyo Climb</strong> は、「今日これから登りに行ける東京・近郊のボルダリングジム」と「ホールド替え（セット替え）による休業・壁制限・新課題情報」を一箇所で素早く確認できるクライマー向けスケジュール集約 PWA です。
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                主要 {dataset.gyms.length} 店舗を網羅
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                B-PUMP、NOBOROCK、Rocky、Base Camp、BOULCOM など主要チェーンから都内近郊の独立系人気ジムまでカバーしています。
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                6時間ごとに自動更新
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                各ジムの公式サイト・ニュース・公式カレンダーからホールド替えや臨時休業、特別営業時間を自動収集・反映しています。
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                ホーム画面でアプリ体験
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                オフライン閲覧・現在地からの近い順・登攀ログ・月間横断カレンダーなど、スマホで快適に使える設計を追求しています。
              </p>
            </div>
          </div>

          <section className="mt-7 space-y-3 border-t border-slate-100 pt-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              データ収集方針とご注意
            </h2>
            <p>
              祝日営業（日本の祝日カレンダー自動判定）や深夜24時以降にまたがる営業時間の判定にも対応していますが、Instagram ストーリー限定の告知や当日急遽発生する貸切・臨時休業は自動取得できない場合があります。ご来店前に各ジムの公式リンク・SNS をあわせてご確認ください。
            </p>
          </section>

          <section className="mt-7 space-y-3 border-t border-slate-100 pt-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              ジムオーナー様・クライミングブランド様へ（PR・協賛掲載のご案内）
            </h2>
            <p>
              Tokyo Climb は、東京都内および近郊で実際に登りに行くアクティブなクライマーに向けたスケジュール特化サイトです。新規オープン告知・コンペや大型ホールド替えのPR・クライミングギアの協賛掲載なども、アプリのユーザー体験を損なわないネイティブカード形式（PR表記付き）にてご相談を承っております。
            </p>
          </section>

          <section className="mt-7 space-y-3 border-t border-slate-100 pt-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              掲載ジム追加・情報修正・お問い合わせ
            </h2>
            <p>
              新規ジムの追加リクエスト、営業時間の変更連絡、ホールド替え情報の提供、広告掲載・協賛のご相談などは以下よりお気軽にご連絡ください。
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <a
                href="https://github.com/araiyutaro/tokyo-climb/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                お問い合わせ / 修正リクエスト（GitHub）
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                プライバシーポリシーを見る
              </Link>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

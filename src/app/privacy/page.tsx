import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mountain, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Tokyo Climb',
  description:
    'Tokyo Climb における個人情報の取り扱い、Cookie・広告配信（Google AdSense）、位置情報（GPS）、ローカルストレージ、免責事項についてご案内します。',
};

export default function PrivacyPolicyPage() {
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

      <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <article className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Privacy Policy
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            プライバシーポリシー
          </h1>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            最終更新日：2026年11月25日
          </p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                1. 基本方針
              </h2>
              <p className="mt-2">
                Tokyo Climb（以下「当サイト」）は、東京都内および近郊のボルダリングジムの営業時間・ホールド替え情報を提供するウェブサービスです。当サイトは利用者のプライバシーを尊重し、個人情報の保護に努めます。
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                2. 端末内データ（LocalStorage）および位置情報（GPS）の取り扱い
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>
                  <strong>お気に入りジム・登攀ログ・テーマ設定：</strong>
                  すべて利用者のブラウザ内（LocalStorage）にのみ保存され、当サイトのサーバーへ送信・収集されることはありません。
                </li>
                <li>
                  <strong>位置情報（GPS）：</strong>
                  「近い順」並び替えやマップ上の現在地表示のために、利用者が明示的に許可した場合のみブラウザ内で距離計算に利用します。位置情報をサーバーへ送信・保存することはありません。
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                3. 広告配信（Google AdSense 等）について
              </h2>
              <p className="mt-2">
                当サイトでは、サイト運営費用の維持を目的として、第三者配信の広告サービス（Google AdSense 等）を利用する場合があります。
              </p>
              <p className="mt-2">
                Google を含む第三者配信事業者は、利用者の興味に応じた広告を表示するために Cookie（クッキー）を使用することがあります。Cookie を使用することで、利用者が当サイトや他のサイトにアクセスした際の情報に基づいて適切な広告が表示されます。
              </p>
              <p className="mt-2">
                利用者は、
                <a
                  href="https://adssettings.google.com/authenticated"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-700 underline dark:text-indigo-400"
                >
                  Google の広告設定
                </a>
                からパーソナライズ広告を無効にできます。また、
                <a
                  href="https://policies.google.com/technologies/ads?hl=ja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-700 underline dark:text-indigo-400"
                >
                  Google ポリシーと規約
                </a>
                もあわせてご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                4. アフィリエイトプログラムについて
              </h2>
              <p className="mt-2">
                当サイトは、クライミング用品等の紹介においてアフィリエイトプログラムを利用する場合があります。プロモーション・広告を含むコンテンツには「PR / 広告」等の表記を明示します。
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                5. アクセス解析ツールについて
              </h2>
              <p className="mt-2">
                当サイトでは、サービス品質向上のためにアクセス解析ツールを利用する場合があります。収集されるデータは匿名であり、個人を特定するものではありません。ブラウザの設定により Cookie を無効にすることで収集を拒否できます。
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                6. 免責事項
              </h2>
              <p className="mt-2">
                当サイトに掲載している営業時間・定休日・ホールド替え・イベント日程等の情報は、各ジムの公式サイト・公式カレンダー・SNS 等をもとに可能な限り正確な情報を掲載するよう努めていますが、突発的な臨時休業や営業時間変更等により最新情報と異なる場合があります。ご来店の際は必ず各ジムの公式発表をご確認ください。当サイトの情報を利用したことにより生じた損害等について、運営者は一切の責任を負いかねます。
              </p>
            </section>

            <section>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                7. お問い合わせ
              </h2>
              <p className="mt-2">
                当サイトのプライバシーポリシー、掲載情報の修正・削除依頼、または広告掲載に関するお問い合わせは、
                <a
                  href="https://github.com/araiyutaro/tokyo-climb/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-700 underline dark:text-indigo-400"
                >
                  GitHub Issues（お問い合わせ窓口）
                </a>
                よりご連絡ください。
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}

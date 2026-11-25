import type { Metadata, Viewport } from 'next';
import { PwaEnhancer } from '@/components/PwaEnhancer';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Tokyo Climb | 東京・近郊ボルダリングジム 営業時間・ホールド替えまとめ',
  description:
    '東京都内および近郊の主要ボルダリングジム46店舗のリアルタイム営業状況、最終ホールド替え日、ホールド替えによる休業・壁制限、イベント予定を一箇所で確認できるスケジュール集約サイト。',
  appleWebApp: {
    capable: true,
    title: 'Tokyo Climb',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Tokyo Climb | 東京・近郊ボルダリングジム 営業時間・ホールド替えまとめ',
    description:
      '東京都内および近郊の主要ボルダリングジム46店舗のリアルタイム営業状況、最終ホールド替え日、月間横断カレンダー。',
    type: 'website',
    locale: 'ja_JP',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const THEME_INIT_SCRIPT = `(function(){try{var k='tokyo-climb:theme:v1';var m=localStorage.getItem(k)||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        {children}
        <PwaEnhancer />
      </body>
    </html>
  );
}

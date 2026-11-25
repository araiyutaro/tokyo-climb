import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { PwaEnhancer } from '@/components/PwaEnhancer';
import { getAdSenseConfig, getSiteUrl } from '@/lib/site';
import './globals.css';

const siteUrl = getSiteUrl();
const adSense = getAdSenseConfig();

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
  ...(adSense.client
    ? {
        other: {
          'google-adsense-account': adSense.client,
        },
      }
    : {}),
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
        {adSense.client && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSense.client}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}

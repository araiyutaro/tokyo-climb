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
    statusBarStyle: 'default',
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
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <PwaEnhancer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tokyo Climb | 東京・近郊ボルダリングジム 営業時間・ホールド替えまとめ',
  description:
    '東京都内および近郊の主要ボルダリングジム31店舗のリアルタイム営業状況、ホールド替えによる休業・壁制限、イベント予定を一箇所で確認できるスケジュール集約サイト。',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

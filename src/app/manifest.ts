import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tokyo Climb | 東京・近郊ボルダリングジムまとめ',
    short_name: 'Tokyo Climb',
    description:
      '東京都内・近郊の主要ボルダリングジム46店舗の営業時間、最終ホールド替え日、ホールド替え休業、イベント情報を一箇所で確認。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    lang: 'ja',
    categories: ['sports', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '今日・今から行けるジム',
        short_name: '今日',
        url: '/?tab=today',
      },
      {
        name: 'お気に入りジム',
        short_name: 'お気に入り',
        url: '/?tab=favorites',
      },
      {
        name: '月間横断カレンダー',
        short_name: 'カレンダー',
        url: '/?tab=calendar',
      },
      {
        name: 'SNS予定取込',
        short_name: 'SNS取込',
        url: '/import',
      },
    ],
  };
}

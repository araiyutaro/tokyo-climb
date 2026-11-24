import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tokyo Climb | 東京・近郊ボルダリングジムまとめ',
    short_name: 'Tokyo Climb',
    description:
      '東京都内・近郊の主要ボルダリングジム31店舗の営業時間、ホールド替え休業、イベント情報を一箇所で確認。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    lang: 'ja',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}

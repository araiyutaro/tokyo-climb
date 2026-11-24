import { ImageResponse } from 'next/og';

export const alt = 'Tokyo Climb | 東京・近郊ボルダリングジム 営業時間・ホールド替えまとめ';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 64 64">
              <path d="M8 50L25 18L36 36L44 23L56 50H8Z" fill="#0f172a" />
              <circle cx="44" cy="14" r="5" fill="#10b981" />
            </svg>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em' }}>Tokyo Climb</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.15 }}>
            Tokyo Bouldering Schedule Hub
          </div>
          <div style={{ fontSize: 28, color: '#cbd5e1' }}>
            31 Tokyo & Nearby Gyms · Live Open Status · Hold Changes · Cross-Gym Calendar
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: '#10b981',
              color: '#022c22',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Live JST Hours
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: '#f43f5e',
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Hold-Change Alerts
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              background: '#38bdf8',
              color: '#082f49',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Monthly Calendar
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

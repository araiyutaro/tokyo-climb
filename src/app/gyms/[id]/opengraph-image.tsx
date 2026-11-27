import { ImageResponse } from 'next/og';
import { loadDataset } from '@/lib/data';
import { AREA_LABEL_MAP, formatTimeRange } from '@/lib/ui-helpers';

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
export const runtime = 'nodejs';

async function loadJapaneseFontSubset(text: string): Promise<ArrayBuffer | null> {
  try {
    const uniqueChars = Array.from(new Set(text)).join('');
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(uniqueChars)}`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        // Request TTF/OTF compatible with Satori
        'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!cssRes.ok) return null;
    const cssText = await cssRes.text();
    const match = cssText.match(/src:\s*url\(([^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/);
    if (!match?.[1]) return null;
    const fontRes = await fetch(match[1], { signal: AbortSignal.timeout(4000) });
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function GymOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { gyms } = loadDataset();
  const gym = gyms.find((g) => g.id === id);

  const gymName = gym?.name ?? 'Tokyo Climb';
  const areaLabel = gym ? AREA_LABEL_MAP[gym.area] : 'Tokyo';
  const station = gym?.nearestStation ?? 'Tokyo & Nearby Bouldering Gyms';
  const weekdayHours = gym ? formatTimeRange(gym.regularHours.mon) : '';
  const weekendHours = gym ? formatTimeRange(gym.regularHours.sat) : '';
  const chainLabel = gym?.chain ?? '';

  const allText = `${gymName}${areaLabel}${station}${chainLabel}平日土日営業時間ホールド替えまとめTokyo Climb24h対応`;
  const fontData = await loadJapaneseFontSubset(allText);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          fontFamily: fontData ? '"Noto Sans JP", sans-serif' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 64 64">
                <path d="M8 50L25 18L36 36L44 23L56 50H8Z" fill="#0f172a" />
                <circle cx="44" cy="14" r="5" fill="#10b981" />
              </svg>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Tokyo Climb</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {chainLabel && (
              <div
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.14)',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {chainLabel}
              </div>
            )}
            <div
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                background: '#10b981',
                color: '#022c22',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {areaLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.18 }}>{gymName}</div>
          <div style={{ fontSize: 28, color: '#cbd5e1' }}>{station}</div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {weekdayHours && (
            <div
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 16,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.35)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {`平日 ${weekdayHours}`}
            </div>
          )}
          {weekendHours && (
            <div
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 16,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.35)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {`土日 ${weekendHours}`}
            </div>
          )}
          {gym?.is24HoursForMembers && (
            <div
              style={{
                display: 'flex',
                padding: '12px 24px',
                borderRadius: 16,
                background: '#0d9488',
                color: '#ffffff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              24h対応
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: 'Noto Sans JP',
                data: fontData,
                style: 'normal',
                weight: 700,
              },
            ],
          }
        : {}),
    },
  );
}

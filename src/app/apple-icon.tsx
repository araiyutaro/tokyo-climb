import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: 36,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 64 64">
          <path d="M8 50L25 18L36 36L44 23L56 50H8Z" fill="#ffffff" />
          <circle cx="44" cy="14" r="5" fill="#10b981" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

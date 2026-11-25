import { describe, it, expect } from 'vitest';
import type { Gym } from '../schema';
import {
  buildAdsTxtLine,
  findNearbyGyms,
  getSiteUrl,
  isValidAdSenseClient,
} from '../site';

const makeGym = (id: string, name: string, lat?: number, lng?: number): Gym => ({
  id,
  name,
  area: 'shinjuku-shibuya',
  prefecture: '東京都',
  address: '東京都新宿区',
  nearestStation: '新宿駅',
  coordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
  regularHours: {
    mon: { open: '10:00', close: '23:00' },
    tue: { open: '10:00', close: '23:00' },
    wed: { open: '10:00', close: '23:00' },
    thu: { open: '10:00', close: '23:00' },
    fri: { open: '10:00', close: '23:00' },
    sat: { open: '10:00', close: '21:00' },
    sun: { open: '10:00', close: '21:00' },
    holiday: { open: '10:00', close: '21:00' },
  },
  links: { website: 'https://example.com' },
});

describe('site helpers (URL, AdSense config, nearby gyms)', () => {
  it('resolves site URL from env and strips trailing slashes', () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://tokyo-climb.jp/' })).toBe(
      'https://tokyo-climb.jp',
    );
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'tokyo-climb.vercel.app' })).toBe(
      'https://tokyo-climb.vercel.app',
    );
    expect(getSiteUrl({})).toBe('http://localhost:3000');
  });

  it('validates AdSense client IDs and builds ads.txt lines safely', () => {
    expect(isValidAdSenseClient('ca-pub-1234567890123456')).toBe(true);
    expect(isValidAdSenseClient('')).toBe(false);
    expect(isValidAdSenseClient('pub-1234567890123456')).toBe(false);
    expect(isValidAdSenseClient('ca-pub-invalid')).toBe(false);

    expect(buildAdsTxtLine('ca-pub-1234567890123456')).toBe(
      'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0',
    );
    expect(buildAdsTxtLine(undefined)).toBeNull();
  });

  it('finds nearby gyms excluding self and sorted by ascending distance', () => {
    const shinjuku = makeGym('shinjuku', '新宿ジム', 35.6896, 139.7006);
    const shibuya = makeGym('shibuya', '渋谷ジム', 35.658, 139.7016);
    const ogikubo = makeGym('ogikubo', '荻窪ジム', 35.7045, 139.6202);
    const yokohama = makeGym('yokohama', '横浜ジム', 35.4658, 139.6223);
    const noCoords = makeGym('nocoords', '座標なしジム');

    const nearby = findNearbyGyms(
      shinjuku,
      [shinjuku, yokohama, ogikubo, noCoords, shibuya],
      2,
    );

    expect(nearby).toHaveLength(2);
    expect(nearby[0].gym.id).toBe('shibuya');
    expect(nearby[1].gym.id).toBe('ogikubo');
    expect(nearby[0].distanceKm).toBeLessThan(nearby[1].distanceKm);
  });
});

import { describe, it, expect } from 'vitest';
import { formatDistanceJa, haversineDistanceKm } from '../geo';

describe('haversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    const shinjuku = { lat: 35.6895, lng: 139.7004 };
    expect(haversineDistanceKm(shinjuku, shinjuku)).toBe(0);
  });

  it('computes accurate straight-line distance between Tokyo stations (~6.3km Shinjuku to Akihabara)', () => {
    const shinjuku = { lat: 35.6896, lng: 139.7006 };
    const akihabara = { lat: 35.6984, lng: 139.7731 };
    const km = haversineDistanceKm(shinjuku, akihabara);
    expect(km).toBeGreaterThan(6.0);
    expect(km).toBeLessThan(7.0);
  });
});

describe('formatDistanceJa', () => {
  it('formats meters under 1km, 1-decimal km under 10km, and integer km at 10km+', () => {
    expect(formatDistanceJa(0.08)).toBe('80m');
    expect(formatDistanceJa(0.456)).toBe('460m');
    expect(formatDistanceJa(1.24)).toBe('1.2km');
    expect(formatDistanceJa(9.94)).toBe('9.9km');
    expect(formatDistanceJa(14.7)).toBe('15km');
  });
});

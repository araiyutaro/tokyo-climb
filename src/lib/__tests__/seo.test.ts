import { describe, it, expect } from 'vitest';
import type { Gym, ScheduleEvent } from '../schema';
import { evaluateGymDayStatus } from '../schedule';
import {
  buildBreadcrumbJsonLd,
  buildGymShareText,
  getLatestCloseTime,
  getRecentHoldChangeGyms,
  getUpcomingHoldChangeEvents,
  isLateNightOr24hGym,
} from '../seo';

const baseHours = {
  mon: { open: '13:00', close: '22:00' },
  tue: { open: '13:00', close: '22:00' },
  wed: { open: '13:00', close: '22:00' },
  thu: { open: '13:00', close: '22:00' },
  fri: { open: '13:00', close: '22:00' },
  sat: { open: '10:00', close: '20:00' },
  sun: { open: '10:00', close: '20:00' },
  holiday: { open: '10:00', close: '20:00' },
};

const gymNormal: Gym = {
  id: 'normal-gym',
  name: '通常ジム',
  area: 'shinjuku-shibuya',
  prefecture: '東京都',
  address: '東京都渋谷区1-1-1',
  nearestStation: '渋谷駅 徒歩5分',
  regularHours: baseHours,
  lastHoldChange: { date: '2026-11-20', summary: '全面セット替え' },
  links: { website: 'https://example.com/normal' },
};

const gymLate: Gym = {
  ...gymNormal,
  id: 'late-gym',
  name: '深夜ジム',
  regularHours: {
    ...baseHours,
    fri: { open: '13:00', close: '24:00' },
  },
  lastHoldChange: { date: '2026-11-26', summary: 'スラブ壁セット' },
};

const gym24h: Gym = {
  ...gymNormal,
  id: 'member-24h',
  name: '24hジム',
  is24HoursForMembers: true,
  lastHoldChange: undefined,
};

const upcomingEvent: ScheduleEvent = {
  id: 'ev-1',
  gymId: 'normal-gym',
  type: 'hold_change_full',
  title: '全壁ホールド替え休業',
  startDate: '2026-12-01',
  endDate: '2026-12-02',
  source: {
    url: 'https://example.com/news',
    label: '公式サイト',
    confidence: 'verified',
    fetchedAt: '2026-11-27T00:00:00Z',
  },
};

describe('seo helpers', () => {
  it('identifies late-night (>=23:00) and 24h member gyms accurately', () => {
    expect(isLateNightOr24hGym(gymNormal)).toBe(false);
    expect(isLateNightOr24hGym(gymLate)).toBe(true);
    expect(isLateNightOr24hGym(gym24h)).toBe(true);
    expect(getLatestCloseTime(gymLate)).toBe('24:00');
  });

  it('sorts recent hold-change gyms freshest first within lookback window', () => {
    const recent = getRecentHoldChangeGyms(
      [gymNormal, gymLate, gym24h],
      [],
      '2026-11-27',
      30,
    );
    expect(recent.map((r) => r.gym.id)).toEqual(['late-gym', 'normal-gym']);
    expect(recent[0].lastHoldChange?.daysAgo).toBe(1);
    expect(recent[1].lastHoldChange?.daysAgo).toBe(7);
  });

  it('collects upcoming hold-change/closure events joined with gym metadata', () => {
    const upcoming = getUpcomingHoldChangeEvents(
      [gymNormal, gymLate],
      [upcomingEvent],
      '2026-11-27',
      60,
    );
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].gym.id).toBe('normal-gym');
    expect(upcoming[0].event.id).toBe('ev-1');
  });

  it('builds share text and BreadcrumbList JSON-LD', () => {
    const status = evaluateGymDayStatus(gymLate, '2026-11-27', []);
    const text = buildGymShareText(status);
    expect(text).toContain('深夜ジム');
    expect(text).toContain('13:00–24:00');
    expect(text).toContain('#TokyoClimb');

    const jsonLd = buildBreadcrumbJsonLd('https://tokyo-climb.jp', [
      { name: 'ホーム', path: '/' },
      { name: '新宿・渋谷', path: '/areas/shinjuku-shibuya' },
    ]);
    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[1].item).toBe('https://tokyo-climb.jp/areas/shinjuku-shibuya');
  });
});

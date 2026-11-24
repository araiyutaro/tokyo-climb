import { describe, it, expect } from 'vitest';
import type { Gym, ScheduleEvent } from '../schema';
import {
  parseTimeToMinutes,
  getJstDateParts,
  mergeEvents,
  evaluateGymDayStatus,
} from '../schedule';

const baseGym: Gym = {
  id: 'bpump-ogikubo',
  name: 'B-PUMP 荻窪',
  chain: 'B-PUMP',
  area: 'chuo-west',
  prefecture: '東京都',
  address: '東京都杉並区上荻1-10-12',
  nearestStation: '荻窪駅 徒歩1分',
  regularHours: {
    mon: { open: '13:00', close: '23:00' },
    tue: { open: '13:00', close: '23:00' },
    wed: { open: '13:00', close: '23:00' },
    thu: { open: '13:00', close: '23:00' },
    fri: { open: '13:00', close: '23:00' },
    sat: { open: '10:00', close: '21:00' },
    sun: { open: '10:00', close: '21:00' },
    holiday: { open: '10:00', close: '21:00' },
  },
  links: {
    website: 'https://pump-climbing.com/gym/ogikubo/',
  },
};

const lateNightGym: Gym = {
  ...baseGym,
  id: 'dbouldering-yokohama',
  name: 'Dボルダリング横浜',
  chain: 'D.Bouldering',
  area: 'kanagawa-saitama',
  prefecture: '神奈川県',
  regularHours: {
    mon: { open: '06:00', close: '26:00' },
    tue: { open: '06:00', close: '26:00' },
    wed: { open: '06:00', close: '26:00' },
    thu: { open: '06:00', close: '26:00' },
    fri: { open: '06:00', close: '26:00' },
    sat: { open: '06:00', close: '26:00' },
    sun: { open: '06:00', close: '26:00' },
    holiday: { open: '06:00', close: '26:00' },
  },
};

const wedClosedGym: Gym = {
  ...baseGym,
  id: 'noborock-mizonokuchi',
  name: 'NOBOROCK 溝ノ口',
  regularHours: {
    ...baseGym.regularHours,
    wed: null,
  },
};

function makeEvent(partial: Partial<ScheduleEvent> & Pick<ScheduleEvent, 'id' | 'gymId' | 'type' | 'title' | 'startDate' | 'endDate'>): ScheduleEvent {
  return {
    source: {
      url: 'https://example.com/news',
      label: '公式お知らせ',
      confidence: 'verified',
      fetchedAt: '2026-11-24T00:00:00Z',
    },
    ...partial,
  };
}

describe('parseTimeToMinutes', () => {
  it('parses standard and past-midnight times', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('13:30')).toBe(810);
    expect(parseTimeToMinutes('24:00')).toBe(1440);
    expect(parseTimeToMinutes('26:00')).toBe(1560);
  });
});

describe('getJstDateParts', () => {
  it('converts UTC timestamp to Asia/Tokyo date and detects Japanese holidays', () => {
    // 2026-11-23 is Labor Thanksgiving Day (勤労感謝の日) in Japan.
    // 2026-11-22T15:30:00Z == 2026-11-23 00:30 JST
    const parts = getJstDateParts(new Date('2026-11-22T15:30:00Z'));
    expect(parts.dateStr).toBe('2026-11-23');
    expect(parts.dayKey).toBe('mon');
    expect(parts.minutesOfDay).toBe(30);
    expect(parts.isHoliday).toBe(true);
    expect(parts.holidayName).toBe('勤労感謝の日');
  });

  it('recognizes normal Tuesday in JST', () => {
    // 2026-11-24 16:00 JST == 2026-11-24T07:00:00Z
    const parts = getJstDateParts(new Date('2026-11-24T07:00:00Z'));
    expect(parts.dateStr).toBe('2026-11-24');
    expect(parts.dayKey).toBe('tue');
    expect(parts.minutesOfDay).toBe(16 * 60);
    expect(parts.isHoliday).toBe(false);
  });
});

describe('mergeEvents', () => {
  it('prefers override event when id matches and preserves non-overlapping events', () => {
    const auto = [
      makeEvent({
        id: 'e1',
        gymId: 'bpump-ogikubo',
        type: 'event',
        title: 'Auto title',
        startDate: '2026-11-25',
        endDate: '2026-11-25',
      }),
      makeEvent({
        id: 'e2',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_partial',
        title: 'Auto partial',
        startDate: '2026-11-26',
        endDate: '2026-11-26',
      }),
    ];

    const overrides = [
      makeEvent({
        id: 'e1',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_full',
        title: 'Override title',
        startDate: '2026-11-25',
        endDate: '2026-11-25',
      }),
      makeEvent({
        id: 'e3',
        gymId: 'bpump-ogikubo',
        type: 'closed',
        title: 'Manual closed',
        startDate: '2026-11-24',
        endDate: '2026-11-24',
      }),
    ];

    const merged = mergeEvents(auto, overrides);
    expect(merged.map((e) => e.id)).toEqual(['e3', 'e1', 'e2']);
    expect(merged.find((e) => e.id === 'e1')?.title).toBe('Override title');
  });
});

describe('evaluateGymDayStatus', () => {
  it('returns open status with remaining minutes during weekday business hours', () => {
    // Tue 2026-11-24 16:00 JST (open 13:00-23:00)
    const now = new Date('2026-11-24T07:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', [], now);

    expect(result.status).toBe('open');
    expect(result.effectiveHours).toEqual({ open: '13:00', close: '23:00' });
    expect(result.minutesUntilClose).toBe(7 * 60);
    expect(result.isSpecialHours).toBe(false);
  });

  it('returns closing_soon when within 60 minutes of closing', () => {
    // Tue 2026-11-24 22:15 JST
    const now = new Date('2026-11-24T13:15:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', [], now);

    expect(result.status).toBe('closing_soon');
    expect(result.minutesUntilClose).toBe(45);
  });

  it('returns opening_soon when within 60 minutes before opening', () => {
    // Tue 2026-11-24 12:30 JST (opens at 13:00)
    const now = new Date('2026-11-24T03:30:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', [], now);

    expect(result.status).toBe('opening_soon');
    expect(result.minutesUntilOpen).toBe(30);
  });

  it('uses holiday regular hours on a Japanese national holiday falling on Monday', () => {
    // Mon 2026-11-23 (勤労感謝の日) 11:00 JST -> holiday hours 10:00-21:00 (normal Mon is 13:00-23:00)
    const now = new Date('2026-11-23T02:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-23', [], now);

    expect(result.isHoliday).toBe(true);
    expect(result.holidayName).toBe('勤労感謝の日');
    expect(result.effectiveHours).toEqual({ open: '10:00', close: '21:00' });
    expect(result.status).toBe('open');
  });

  it('marks gym as regular_closed on weekly closed day', () => {
    // Wed 2026-11-25 15:00 JST
    const now = new Date('2026-11-25T06:00:00Z');
    const result = evaluateGymDayStatus(wedClosedGym, '2026-11-25', [], now);

    expect(result.status).toBe('regular_closed');
    expect(result.effectiveHours).toBeNull();
  });

  it('marks gym as hold_change_closed when hold_change_full covers the date', () => {
    const events: ScheduleEvent[] = [
      makeEvent({
        id: 'hc-1',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_full',
        title: '全面ホールド替え休業',
        startDate: '2026-11-24',
        endDate: '2026-11-26',
      }),
    ];

    const now = new Date('2026-11-24T07:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', events, now);

    expect(result.status).toBe('hold_change_closed');
    expect(result.effectiveHours).toBeNull();
    expect(result.eventsOnDate).toHaveLength(1);
  });

  it('keeps gym open but flags partial hold change alert when hold_change_partial occurs', () => {
    const events: ScheduleEvent[] = [
      makeEvent({
        id: 'hc-partial',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_partial',
        title: '2F壁ホールド替え（一部利用不可）',
        affectedAreas: ['2F'],
        startDate: '2026-11-24',
        endDate: '2026-11-24',
      }),
    ];

    const now = new Date('2026-11-24T07:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', events, now);

    expect(result.status).toBe('open');
    expect(result.hasPartialHoldChange).toBe(true);
    expect(result.eventsOnDate[0].affectedAreas).toEqual(['2F']);
  });

  it('applies specialHours override when hours_change event exists', () => {
    const events: ScheduleEvent[] = [
      makeEvent({
        id: 'hc-hours',
        gymId: 'bpump-ogikubo',
        type: 'hours_change',
        title: 'イベント準備のため19時閉店',
        startDate: '2026-11-24',
        endDate: '2026-11-24',
        specialHours: { open: '13:00', close: '19:00' },
      }),
    ];

    // 18:30 JST -> closing_soon (30 min left) instead of normal 23:00
    const now = new Date('2026-11-24T09:30:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', events, now);

    expect(result.isSpecialHours).toBe(true);
    expect(result.effectiveHours).toEqual({ open: '13:00', close: '19:00' });
    expect(result.status).toBe('closing_soon');
    expect(result.minutesUntilClose).toBe(30);
  });

  it('handles past-midnight closing times (e.g. 06:00-26:00 checked at 01:15 JST)', () => {
    // 2026-11-25 01:15 JST == 2026-11-24T16:15:00Z
    // Previous day (2026-11-24) is open until 26:00 (02:00 next morning), so 45 mins left!
    const now = new Date('2026-11-24T16:15:00Z');
    const result = evaluateGymDayStatus(lateNightGym, '2026-11-25', [], now);

    expect(result.status).toBe('closing_soon');
    expect(result.minutesUntilClose).toBe(45);
    expect(result.isFromPreviousBusinessDay).toBe(true);
  });

  it('collects upcoming hold change or closure alerts within the next 30 days', () => {
    const events: ScheduleEvent[] = [
      makeEvent({
        id: 'soon-1',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_full',
        title: '明後日からホールド替え',
        startDate: '2026-11-26',
        endDate: '2026-11-27',
      }),
      makeEvent({
        id: 'within-month-1',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_full',
        title: '来週のホールド替え',
        startDate: '2026-12-05',
        endDate: '2026-12-06',
      }),
      makeEvent({
        id: 'far-1',
        gymId: 'bpump-ogikubo',
        type: 'hold_change_full',
        title: '1ヶ月以上先のホールド替え',
        startDate: '2027-01-10',
        endDate: '2027-01-11',
      }),
    ];

    const now = new Date('2026-11-24T07:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-24', events, now);

    expect(result.upcomingAlerts.map((e) => e.id)).toEqual(['soon-1', 'within-month-1']);
  });

  it('returns scheduled_open for a future date rather than live open/closed_now', () => {
    const now = new Date('2026-11-24T07:00:00Z');
    const result = evaluateGymDayStatus(baseGym, '2026-11-25', [], now);

    expect(result.status).toBe('scheduled_open');
    expect(result.effectiveHours).toEqual({ open: '13:00', close: '23:00' });
  });
});

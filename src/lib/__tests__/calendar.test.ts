import { describe, it, expect } from 'vitest';
import type { Gym, ScheduleEvent } from '../schema';
import { buildMonthCalendar } from '../calendar';

const gyms: Gym[] = [
  {
    id: 'westrock-chofu',
    name: 'WESTROCK 調布',
    chain: 'WESTROCK',
    area: 'tama',
    prefecture: '東京都',
    address: '東京都調布市',
    nearestStation: '西調布駅',
    regularHours: {
      mon: { open: '13:00', close: '23:00' },
      tue: { open: '13:00', close: '23:00' },
      wed: { open: '13:00', close: '23:00' },
      thu: { open: '13:00', close: '23:00' },
      fri: { open: '13:00', close: '23:00' },
      sat: { open: '10:00', close: '22:00' },
      sun: { open: '10:00', close: '21:00' },
      holiday: { open: '10:00', close: '21:00' },
    },
    links: { website: 'https://www.westrock-climbing.com/' },
  },
  {
    id: 'bpump-akiba',
    name: 'B-PUMP TOKYO 秋葉原',
    chain: 'B-PUMP',
    area: 'akiba-east',
    prefecture: '東京都',
    address: '東京都文京区湯島',
    nearestStation: '秋葉原駅',
    regularHours: {
      mon: { open: '12:00', close: '23:00' },
      tue: { open: '12:00', close: '23:00' },
      wed: { open: '12:00', close: '23:00' },
      thu: { open: '12:00', close: '23:00' },
      fri: { open: '12:00', close: '23:00' },
      sat: { open: '11:00', close: '21:00' },
      sun: { open: '10:00', close: '21:00' },
      holiday: { open: '11:00', close: '21:00' },
    },
    links: { website: 'https://pump-climbing.com/gym/akiba/' },
  },
];

const events: ScheduleEvent[] = [
  {
    id: 'e-chofu-hold',
    gymId: 'westrock-chofu',
    type: 'hold_change_full',
    title: '調布店 全面ホールド替え休業',
    startDate: '2026-11-30',
    endDate: '2026-12-04',
    source: {
      url: 'https://www.westrock-climbing.com/',
      label: '公式',
      confidence: 'verified',
      fetchedAt: '2026-11-24T00:00:00Z',
    },
  },
  {
    id: 'e-akiba-comp',
    gymId: 'bpump-akiba',
    type: 'event',
    title: 'マンスリーセッション',
    startDate: '2026-11-28',
    endDate: '2026-11-28',
    source: {
      url: 'https://pump-climbing.com/gym/akiba/',
      label: '公式',
      confidence: 'auto',
      fetchedAt: '2026-11-24T00:00:00Z',
    },
  },
];

describe('buildMonthCalendar', () => {
  it('builds a Sunday-start calendar grid for November 2026 with holiday & today flags', () => {
    const cells = buildMonthCalendar(2026, 11, gyms, events, {
      todayStr: '2026-11-24',
    });

    // Nov 1, 2026 is Sunday, Nov 30 is Monday -> 5 weeks = 35 cells
    expect(cells.length % 7).toBe(0);
    expect(cells[0].dateStr).toBe('2026-11-01');
    expect(cells[0].isCurrentMonth).toBe(true);

    const nov23 = cells.find((c) => c.dateStr === '2026-11-23');
    expect(nov23?.isHoliday).toBe(true);
    expect(nov23?.holidayName).toBe('勤労感謝の日');

    const nov24 = cells.find((c) => c.dateStr === '2026-11-24');
    expect(nov24?.isToday).toBe(true);

    const nov30 = cells.find((c) => c.dateStr === '2026-11-30');
    expect(nov30?.items).toHaveLength(1);
    expect(nov30?.items[0].gymName).toBe('WESTROCK 調布');
    expect(nov30?.counts.closed).toBe(1);
  });

  it('filters calendar events by favorite gymIds and event types', () => {
    const cells = buildMonthCalendar(2026, 11, gyms, events, {
      todayStr: '2026-11-24',
      gymIds: ['bpump-akiba'],
    });

    const nov30 = cells.find((c) => c.dateStr === '2026-11-30');
    expect(nov30?.items).toHaveLength(0);

    const nov28 = cells.find((c) => c.dateStr === '2026-11-28');
    expect(nov28?.items).toHaveLength(1);
    expect(nov28?.counts.event).toBe(1);
  });

  it('spans multi-day events across month boundary into December 2026', () => {
    const decCells = buildMonthCalendar(2026, 12, gyms, events, {
      todayStr: '2026-11-24',
    });

    const dec1 = decCells.find((c) => c.dateStr === '2026-12-01');
    const dec4 = decCells.find((c) => c.dateStr === '2026-12-04');
    const dec5 = decCells.find((c) => c.dateStr === '2026-12-05');

    expect(dec1?.items).toHaveLength(1);
    expect(dec4?.items).toHaveLength(1);
    expect(dec5?.items).toHaveLength(0);
  });
});

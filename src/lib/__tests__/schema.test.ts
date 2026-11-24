import { describe, it, expect } from 'vitest';
import {
  TimeRangeSchema,
  GymSchema,
  ScheduleEventSchema,
  GymsFileSchema,
  EventsFileSchema,
} from '../schema';

describe('schema validation', () => {
  it('accepts normal and past-midnight time ranges', () => {
    expect(TimeRangeSchema.parse({ open: '10:00', close: '23:00' })).toEqual({
      open: '10:00',
      close: '23:00',
    });
    expect(TimeRangeSchema.parse({ open: '06:00', close: '26:00' })).toEqual({
      open: '06:00',
      close: '26:00',
    });
    expect(TimeRangeSchema.parse({ open: '00:00', close: '24:00' })).toEqual({
      open: '00:00',
      close: '24:00',
    });
  });

  it('rejects invalid time ranges where close <= open or format is invalid', () => {
    expect(() => TimeRangeSchema.parse({ open: '23:00', close: '10:00' })).toThrow();
    expect(() => TimeRangeSchema.parse({ open: '10:00', close: '10:00' })).toThrow();
    expect(() => TimeRangeSchema.parse({ open: '9:00', close: '21:00' })).toThrow();
    expect(() => TimeRangeSchema.parse({ open: '10:65', close: '21:00' })).toThrow();
  });

  it('validates a complete gym entry with per-day hours and nullable closed days', () => {
    const validGym = {
      id: 'noborock-mizonokuchi',
      name: 'NOBOROCK 溝ノ口',
      chain: 'NOBOROCK',
      area: 'kanagawa-saitama',
      prefecture: '神奈川県',
      address: '神奈川県川崎市高津区溝口1-1-1',
      nearestStation: '溝の口駅 徒歩3分',
      regularHours: {
        mon: { open: '10:00', close: '23:00' },
        tue: { open: '10:00', close: '23:00' },
        wed: null,
        thu: { open: '10:00', close: '23:00' },
        fri: { open: '10:00', close: '23:00' },
        sat: { open: '10:00', close: '20:00' },
        sun: { open: '10:00', close: '19:00' },
        holiday: { open: '10:00', close: '19:00' },
      },
      links: {
        website: 'https://noborock-climbing.com/',
        scheduleUrl: 'https://noborock-climbing.com/%e3%82%ab%e3%83%ac%e3%83%b3%e3%83%80%e3%83%bc/',
      },
    };

    const parsed = GymSchema.parse(validGym);
    expect(parsed.id).toBe('noborock-mizonokuchi');
    expect(parsed.regularHours.wed).toBeNull();
  });

  it('validates schedule events and rejects endDate earlier than startDate', () => {
    const validEvent = {
      id: 'westrock-chofu-2026-11-30-hold',
      gymId: 'westrock-chofu',
      type: 'hold_change_full',
      title: '調布店 全面ホールド替え休業',
      startDate: '2026-11-30',
      endDate: '2026-12-04',
      source: {
        url: 'https://www.westrock-climbing.com/',
        label: '公式サイトお知らせ',
        confidence: 'verified',
        fetchedAt: '2026-11-24T07:00:00Z',
      },
    };

    expect(ScheduleEventSchema.parse(validEvent).type).toBe('hold_change_full');

    expect(() =>
      ScheduleEventSchema.parse({
        ...validEvent,
        startDate: '2026-12-05',
        endDate: '2026-12-04',
      }),
    ).toThrow();
  });

  it('requires specialHours when event type is hours_change', () => {
    expect(() =>
      ScheduleEventSchema.parse({
        id: 'evt-1',
        gymId: 'bpump-ogikubo',
        type: 'hours_change',
        title: '時短営業',
        startDate: '2026-11-25',
        endDate: '2026-11-25',
        source: {
          url: 'https://pump-climbing.com/',
          label: '公式',
          confidence: 'auto',
          fetchedAt: '2026-11-24T07:00:00Z',
        },
      }),
    ).toThrow();
  });

  it('validates file wrapper schemas', () => {
    expect(
      GymsFileSchema.parse({
        updatedAt: '2026-11-24T07:00:00Z',
        gyms: [],
      }).gyms,
    ).toEqual([]);

    expect(
      EventsFileSchema.parse({
        updatedAt: '2026-11-24T07:00:00Z',
        events: [],
      }).events,
    ).toEqual([]);
  });
});

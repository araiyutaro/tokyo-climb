import { describe, it, expect } from 'vitest';
import type { Gym, ScheduleEvent } from '../schema';
import { buildGoogleCalendarUrl, buildIcsContent } from '../calendar-export';

const sampleGym: Gym = {
  id: 'westrock-chofu',
  name: 'WESTROCK 調布',
  chain: 'WESTROCK',
  area: 'tama',
  prefecture: '東京都',
  address: '東京都調布市上石原1-43-1',
  nearestStation: '西調布駅 徒歩8分',
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
};

const sampleEvent: ScheduleEvent = {
  id: 'westrock-chofu-2026-11-30-full-hold-change',
  gymId: 'westrock-chofu',
  type: 'hold_change_full',
  title: '調布店 全面ホールド替え休業',
  description: '5日間終日休業となります。',
  startDate: '2026-11-30',
  endDate: '2026-12-04',
  source: {
    url: 'https://www.westrock-climbing.com/',
    label: '公式サイトお知らせ',
    confidence: 'verified',
    fetchedAt: '2026-11-24T07:20:00Z',
  },
};

describe('calendar-export', () => {
  it('builds a Google Calendar URL with exclusive end date (+1 day for all-day events)', () => {
    const url = buildGoogleCalendarUrl(sampleGym, sampleEvent);
    const parsed = new URL(url);

    expect(parsed.origin).toBe('https://calendar.google.com');
    expect(parsed.pathname).toBe('/calendar/render');
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsed.searchParams.get('text')).toContain('WESTROCK 調布');
    expect(parsed.searchParams.get('text')).toContain('全面ホールド替え休業');
    // 2026-11-30 through 2026-12-04 inclusive => exclusive end is 2026-12-05
    expect(parsed.searchParams.get('dates')).toBe('20261130/20261205');
    expect(parsed.searchParams.get('location')).toBe('東京都調布市上石原1-43-1');
    expect(parsed.searchParams.get('details')).toContain('https://www.westrock-climbing.com/');
  });

  it('builds a valid RFC 5545 ICS string with VEVENT fields and CRLF line endings', () => {
    const ics = buildIcsContent(sampleGym, sampleEvent);
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261130\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261205\r\n');
    expect(ics).toContain('SUMMARY:[WESTROCK 調布] 調布店 全面ホールド替え休業\r\n');
    expect(ics).toContain('LOCATION:東京都調布市上石原1-43-1\r\n');
    expect(ics).toContain('END:VEVENT\r\n');
    expect(ics).toContain('END:VCALENDAR');
  });
});

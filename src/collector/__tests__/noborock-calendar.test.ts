import { describe, it, expect } from 'vitest';
import type { Gym } from '@/lib/schema';
import { parseNoborockCalendarHtml } from '../noborock-calendar';

const takadanobabaGym: Gym = {
  id: 'noborock-takadanobaba',
  name: 'NOBOROCK 高田馬場',
  chain: 'NOBOROCK',
  area: 'shinjuku-shibuya',
  prefecture: '東京都',
  address: '東京都新宿区高田馬場1-26-12',
  nearestStation: '高田馬場駅 徒歩4分',
  regularHours: {
    mon: { open: '10:00', close: '22:45' },
    tue: { open: '10:00', close: '22:45' },
    wed: { open: '10:00', close: '22:45' },
    thu: { open: '10:00', close: '22:45' },
    fri: { open: '10:00', close: '22:45' },
    sat: { open: '10:00', close: '21:00' },
    sun: { open: '10:00', close: '21:00' },
    holiday: { open: '10:00', close: '21:00' },
  },
  links: {
    website: 'https://noborock-climbing.com/program/takadanobaba/',
    scheduleUrl: 'https://noborock-climbing.com/calendar/',
  },
  collector: {
    adapter: 'noborock-calendar',
    feedUrl: 'https://noborock-climbing.com/calendar/',
    storeKeyword: '高田馬場',
  },
};

const SAMPLE_AI1EC_HTML = `
<html>
<body>
  <span class="ai1ec-calendar-title">11月 2026</span>
  <a class="ai1ec-next-month" href="https://noborock-climbing.com/calendar/action~month/exact_date~1796050800/">次月</a>
  <table>
    <tr>
      <td class="ai1ec-empty"></td>
      <td>
        <div class="ai1ec-date">3</div>
        <a href="https://noborock-climbing.com/event/1"><span class="ai1ec-event-title">高田馬場17:00 close</span></a>
        <a href="https://noborock-climbing.com/event/2"><span class="ai1ec-event-title">大宮17:00 close</span></a>
      </td>
      <td>
        <div class="ai1ec-date">4</div>
        <a href="https://noborock-climbing.com/event/3"><span class="ai1ec-event-title">高田馬場休業【ルートセット】</span></a>
      </td>
      <td>
        <div class="ai1ec-date">5</div>
        <a href="https://noborock-climbing.com/event/4"><span class="ai1ec-event-title">高田馬場18:30 open!</span></a>
      </td>
    </tr>
  </table>
</body>
</html>
`;

describe('parseNoborockCalendarHtml', () => {
  it('extracts store-specific route-set closures and special open/close times with nextMonthUrl', () => {
    const result = parseNoborockCalendarHtml(
      SAMPLE_AI1EC_HTML,
      takadanobabaGym,
      'https://noborock-climbing.com/calendar/',
      new Date('2026-11-24T00:00:00Z'),
    );

    expect(result.nextMonthUrl).toBe(
      'https://noborock-climbing.com/calendar/action~month/exact_date~1796050800/',
    );
    expect(result.events).toHaveLength(3);

    const earlyClose = result.events.find((e) => e.startDate === '2026-11-03');
    expect(earlyClose?.type).toBe('hours_change');
    expect(earlyClose?.specialHours).toEqual({ open: '10:00', close: '17:00' });

    const setClosure = result.events.find((e) => e.startDate === '2026-11-04');
    expect(setClosure?.type).toBe('hold_change_full');

    const lateOpen = result.events.find((e) => e.startDate === '2026-11-05');
    expect(lateOpen?.type).toBe('hours_change');
    expect(lateOpen?.specialHours).toEqual({ open: '18:30', close: '22:45' });
  });
});

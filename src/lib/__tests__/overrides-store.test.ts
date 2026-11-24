import { describe, it, expect } from 'vitest';
import type { ScheduleEvent } from '../schema';
import { upsertOverrideEvent, removeOverrideEvent } from '../overrides-store';

function makeEvent(id: string, startDate: string, title = 'テスト予定'): ScheduleEvent {
  return {
    id,
    gymId: 'bpump-ogikubo',
    type: 'hold_change_partial',
    title,
    startDate,
    endDate: startDate,
    source: {
      url: 'https://www.instagram.com/bpump_ogikubo/',
      label: 'Instagram手動登録',
      confidence: 'verified',
      fetchedAt: '2026-11-24T08:00:00Z',
    },
  };
}

describe('overrides-store', () => {
  it('upserts new events in chronological order and replaces existing event with same id', () => {
    const initial = [makeEvent('ev-2', '2026-12-05', 'Old title')];
    const added = upsertOverrideEvent(initial, makeEvent('ev-1', '2026-11-28', 'Earlier event'));
    expect(added.map((e) => e.id)).toEqual(['ev-1', 'ev-2']);

    const replaced = upsertOverrideEvent(added, makeEvent('ev-2', '2026-12-05', 'Updated title'));
    expect(replaced).toHaveLength(2);
    expect(replaced.find((e) => e.id === 'ev-2')?.title).toBe('Updated title');
  });

  it('removes an override event by id', () => {
    const list = [makeEvent('ev-1', '2026-11-28'), makeEvent('ev-2', '2026-12-05')];
    const after = removeOverrideEvent(list, 'ev-1');
    expect(after.map((e) => e.id)).toEqual(['ev-2']);
  });
});

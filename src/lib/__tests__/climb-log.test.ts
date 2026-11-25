import { describe, it, expect } from 'vitest';
import {
  addClimbVisit,
  removeClimbVisit,
  hasVisitedOnDate,
  computeClimbStats,
  type ClimbVisit,
} from '../climb-log';

describe('climb-log', () => {
  it('adds visits, prevents duplicate (gymId, date) by updating note, and removes visits cleanly', () => {
    let visits: ClimbVisit[] = [];
    visits = addClimbVisit(visits, 'noborock-shibuya', '2026-11-25', '2級3本完登！');
    expect(visits).toHaveLength(1);
    expect(hasVisitedOnDate(visits, 'noborock-shibuya', '2026-11-25')).toBe(true);

    // Updating same gym & same date updates note instead of duplicating
    visits = addClimbVisit(visits, 'noborock-shibuya', '2026-11-25', '2級4本完登！');
    expect(visits).toHaveLength(1);
    expect(visits[0].note).toBe('2級4本完登！');

    visits = addClimbVisit(visits, 'mitaka-gym', '2026-11-23');
    expect(visits).toHaveLength(2);
    // Newest date first
    expect(visits[0].date).toBe('2026-11-25');

    visits = removeClimbVisit(visits, visits[0].id);
    expect(visits).toHaveLength(1);
    expect(visits[0].gymId).toBe('mitaka-gym');
  });

  it('computes monthly count, total visits, unique gyms, and per-gym last visit stats', () => {
    const visits: ClimbVisit[] = [
      { id: 'v1', gymId: 'noborock-shibuya', date: '2026-11-25', createdAt: '2026-11-25T10:00:00Z' },
      { id: 'v2', gymId: 'mitaka-gym', date: '2026-11-22', createdAt: '2026-11-22T10:00:00Z' },
      { id: 'v3', gymId: 'noborock-shibuya', date: '2026-11-18', createdAt: '2026-11-18T10:00:00Z' },
      { id: 'v4', gymId: 'bpump-ogikubo', date: '2026-10-29', createdAt: '2026-10-29T10:00:00Z' },
    ];

    const stats = computeClimbStats(visits, '2026-11-25');
    expect(stats.totalVisits).toBe(4);
    expect(stats.thisMonthCount).toBe(3);
    expect(stats.uniqueGymsCount).toBe(3);
    expect(stats.byGym['noborock-shibuya']).toEqual({
      count: 2,
      lastDate: '2026-11-25',
      daysAgo: 0,
    });
    expect(stats.byGym['mitaka-gym']).toEqual({
      count: 1,
      lastDate: '2026-11-22',
      daysAgo: 3,
    });
    expect(stats.topGyms[0]).toEqual({ gymId: 'noborock-shibuya', count: 2 });
  });
});

import { diffDaysBetweenDateStr } from './schedule';

export interface ClimbVisit {
  id: string;
  gymId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface GymVisitSummary {
  count: number;
  lastDate: string;
  daysAgo: number;
}

export interface ClimbStats {
  totalVisits: number;
  thisMonthCount: number;
  uniqueGymsCount: number;
  byGym: Record<string, GymVisitSummary>;
  topGyms: Array<{ gymId: string; count: number }>;
}

export const CLIMB_LOG_STORAGE_KEY = 'tokyo-climb:visits:v1';

export function addClimbVisit(
  visits: ClimbVisit[],
  gymId: string,
  date: string,
  note?: string,
  now: Date = new Date(),
): ClimbVisit[] {
  const trimmedNote = note?.trim() || undefined;
  const existingIdx = visits.findIndex((v) => v.gymId === gymId && v.date === date);

  let next: ClimbVisit[];
  if (existingIdx >= 0) {
    next = visits.map((v, i) =>
      i === existingIdx ? { ...v, note: trimmedNote ?? v.note } : v,
    );
  } else {
    const newVisit: ClimbVisit = {
      id: `visit-${gymId}-${date}-${Math.random().toString(36).slice(2, 7)}`,
      gymId,
      date,
      note: trimmedNote,
      createdAt: now.toISOString(),
    };
    next = [newVisit, ...visits];
  }

  return next.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function removeClimbVisit(visits: ClimbVisit[], visitId: string): ClimbVisit[] {
  return visits.filter((v) => v.id !== visitId);
}

export function hasVisitedOnDate(
  visits: ClimbVisit[],
  gymId: string,
  date: string,
): boolean {
  return visits.some((v) => v.gymId === gymId && v.date === date);
}

export function computeClimbStats(visits: ClimbVisit[], todayStr: string): ClimbStats {
  const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
  let thisMonthCount = 0;
  const byGym: Record<string, GymVisitSummary> = {};

  for (const v of visits) {
    if (v.date.startsWith(monthPrefix)) {
      thisMonthCount += 1;
    }
    const existing = byGym[v.gymId];
    if (!existing) {
      byGym[v.gymId] = {
        count: 1,
        lastDate: v.date,
        daysAgo: Math.max(0, diffDaysBetweenDateStr(todayStr, v.date)),
      };
    } else {
      const latestDate = v.date > existing.lastDate ? v.date : existing.lastDate;
      byGym[v.gymId] = {
        count: existing.count + 1,
        lastDate: latestDate,
        daysAgo: Math.max(0, diffDaysBetweenDateStr(todayStr, latestDate)),
      };
    }
  }

  const topGyms = Object.entries(byGym)
    .map(([gymId, info]) => ({ gymId, count: info.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalVisits: visits.length,
    thisMonthCount,
    uniqueGymsCount: Object.keys(byGym).length,
    byGym,
    topGyms,
  };
}

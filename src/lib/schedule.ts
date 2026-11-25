import holidayJp from '@holiday-jp/holiday_jp';
import type { DayKey, Gym, ScheduleEvent, TimeRange } from './schema';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_KEYS: Exclude<DayKey, 'holiday'>[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export function parseTimeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToDuration(totalMinutes: number): string {
  const clamped = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function getJapaneseHolidayName(dateStr: string): string | undefined {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const holidays = holidayJp.between(utcDate, utcDate);
  return holidays.length > 0 ? holidays[0].name : undefined;
}

export function getDayKeyForDateStr(dateStr: string): Exclude<DayKey, 'holiday'> {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return DAY_KEYS[utcDate.getUTCDay()];
}

export function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day + offsetDays));
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysBetweenDateStr(laterDateStr: string, earlierDateStr: string): number {
  const [ly, lm, ld] = laterDateStr.split('-').map(Number);
  const [ey, em, ed] = earlierDateStr.split('-').map(Number);
  const laterMs = Date.UTC(ly, lm - 1, ld);
  const earlierMs = Date.UTC(ey, em - 1, ed);
  return Math.round((laterMs - earlierMs) / (24 * 60 * 60 * 1000));
}

export interface JstDateParts {
  dateStr: string;
  dayKey: Exclude<DayKey, 'holiday'>;
  minutesOfDay: number;
  isHoliday: boolean;
  holidayName?: string;
}

export function getJstDateParts(now: Date): JstDateParts {
  const jstMs = now.getTime() + JST_OFFSET_MS;
  const jst = new Date(jstMs);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jst.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const dayKey = DAY_KEYS[jst.getUTCDay()];
  const minutesOfDay = jst.getUTCHours() * 60 + jst.getUTCMinutes();
  const holidayName = getJapaneseHolidayName(dateStr);

  return {
    dateStr,
    dayKey,
    minutesOfDay,
    isHoliday: Boolean(holidayName),
    holidayName,
  };
}

export function mergeEvents(
  autoEvents: ScheduleEvent[],
  overrideEvents: ScheduleEvent[],
): ScheduleEvent[] {
  const byId = new Map<string, ScheduleEvent>();
  for (const ev of autoEvents) {
    byId.set(ev.id, ev);
  }
  for (const ev of overrideEvents) {
    byId.set(ev.id, ev);
  }
  return Array.from(byId.values()).sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
    return a.id.localeCompare(b.id);
  });
}

export function getEventsForGymOnDate(
  gymId: string,
  dateStr: string,
  events: ScheduleEvent[],
): ScheduleEvent[] {
  return events.filter(
    (ev) => ev.gymId === gymId && ev.startDate <= dateStr && dateStr <= ev.endDate,
  );
}

interface DayHoursResolution {
  effectiveHours: TimeRange | null;
  closedReason: 'hold_change_closed' | 'temp_closed' | 'regular_closed' | null;
  isSpecialHours: boolean;
  isHoliday: boolean;
  holidayName?: string;
  eventsOnDate: ScheduleEvent[];
}

function resolveDayHours(
  gym: Gym,
  dateStr: string,
  events: ScheduleEvent[],
): DayHoursResolution {
  const eventsOnDate = getEventsForGymOnDate(gym.id, dateStr, events);
  const holidayName = getJapaneseHolidayName(dateStr);
  const isHoliday = Boolean(holidayName);
  const dayKey = getDayKeyForDateStr(dateStr);

  if (eventsOnDate.some((e) => e.type === 'hold_change_full')) {
    return {
      effectiveHours: null,
      closedReason: 'hold_change_closed',
      isSpecialHours: false,
      isHoliday,
      holidayName,
      eventsOnDate,
    };
  }

  if (eventsOnDate.some((e) => e.type === 'closed')) {
    return {
      effectiveHours: null,
      closedReason: 'temp_closed',
      isSpecialHours: false,
      isHoliday,
      holidayName,
      eventsOnDate,
    };
  }

  const hoursChange = eventsOnDate.find(
    (e) => e.type === 'hours_change' && e.specialHours,
  );
  if (hoursChange?.specialHours) {
    return {
      effectiveHours: hoursChange.specialHours,
      closedReason: null,
      isSpecialHours: true,
      isHoliday,
      holidayName,
      eventsOnDate,
    };
  }

  const regular = isHoliday ? gym.regularHours.holiday : gym.regularHours[dayKey];
  if (!regular) {
    return {
      effectiveHours: null,
      closedReason: 'regular_closed',
      isSpecialHours: false,
      isHoliday,
      holidayName,
      eventsOnDate,
    };
  }

  return {
    effectiveHours: regular,
    closedReason: null,
    isSpecialHours: false,
    isHoliday,
    holidayName,
    eventsOnDate,
  };
}

export type LiveGymStatus =
  | 'open'
  | 'closing_soon'
  | 'opening_soon'
  | 'closed_now'
  | 'hold_change_closed'
  | 'temp_closed'
  | 'regular_closed'
  | 'scheduled_open';

export interface LastHoldChangeInfo {
  date: string;
  daysAgo: number;
  title: string;
  type?: 'hold_change_full' | 'hold_change_partial';
  sourceUrl?: string;
}

export interface GymDayStatus {
  gym: Gym;
  dateStr: string;
  status: LiveGymStatus;
  effectiveHours: TimeRange | null;
  isSpecialHours: boolean;
  isHoliday: boolean;
  holidayName?: string;
  minutesUntilClose?: number;
  minutesUntilOpen?: number;
  isFromPreviousBusinessDay?: boolean;
  hasPartialHoldChange: boolean;
  hasEvent: boolean;
  eventsOnDate: ScheduleEvent[];
  upcomingAlerts: ScheduleEvent[];
  lastHoldChange?: LastHoldChangeInfo;
}

function resolveLastHoldChange(
  gym: Gym,
  dateStr: string,
  events: ScheduleEvent[],
): LastHoldChangeInfo | undefined {
  let latest: LastHoldChangeInfo | undefined;

  if (gym.lastHoldChange && gym.lastHoldChange.date <= dateStr) {
    latest = {
      date: gym.lastHoldChange.date,
      daysAgo: diffDaysBetweenDateStr(dateStr, gym.lastHoldChange.date),
      title: gym.lastHoldChange.summary ?? 'ホールド替え',
      type: gym.lastHoldChange.type,
      sourceUrl: gym.lastHoldChange.sourceUrl,
    };
  }

  for (const ev of events) {
    if (ev.gymId !== gym.id) continue;
    if (ev.type !== 'hold_change_full' && ev.type !== 'hold_change_partial') continue;
    if (ev.endDate > dateStr) continue;

    if (!latest || ev.endDate >= latest.date) {
      latest = {
        date: ev.endDate,
        daysAgo: diffDaysBetweenDateStr(dateStr, ev.endDate),
        title: ev.title,
        type: ev.type,
        sourceUrl: ev.source.url,
      };
    }
  }

  return latest;
}

export function evaluateGymDayStatus(
  gym: Gym,
  dateStr: string,
  events: ScheduleEvent[],
  now?: Date,
): GymDayStatus {
  const resolution = resolveDayHours(gym, dateStr, events);
  const hasPartialHoldChange = resolution.eventsOnDate.some(
    (e) => e.type === 'hold_change_partial',
  );
  const hasEvent = resolution.eventsOnDate.some((e) => e.type === 'event');
  const lastHoldChange = resolveLastHoldChange(gym, dateStr, events);

  // Collect upcoming alerts (next 1..30 days) that affect climbing availability
  const nextStart = addDaysToDateStr(dateStr, 1);
  const nextEnd = addDaysToDateStr(dateStr, 30);
  const upcomingAlerts = events
    .filter(
      (ev) =>
        ev.gymId === gym.id &&
        (ev.type === 'hold_change_full' ||
          ev.type === 'hold_change_partial' ||
          ev.type === 'closed' ||
          ev.type === 'hours_change') &&
        ev.startDate >= nextStart &&
        ev.startDate <= nextEnd,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const base: Omit<GymDayStatus, 'status'> = {
    gym,
    dateStr,
    effectiveHours: resolution.effectiveHours,
    isSpecialHours: resolution.isSpecialHours,
    isHoliday: resolution.isHoliday,
    holidayName: resolution.holidayName,
    hasPartialHoldChange,
    hasEvent,
    eventsOnDate: resolution.eventsOnDate,
    upcomingAlerts,
    lastHoldChange,
  };

  if (now) {
    const jstNow = getJstDateParts(now);

    if (jstNow.dateStr === dateStr) {
      // Check midnight-crossover from previous business day (e.g. 06:00-26:00 checked at 01:15 JST)
      const prevDateStr = addDaysToDateStr(dateStr, -1);
      const prevResolution = resolveDayHours(gym, prevDateStr, events);
      if (prevResolution.effectiveHours) {
        const prevClose = parseTimeToMinutes(prevResolution.effectiveHours.close);
        if (prevClose > 24 * 60) {
          const currentExtended = 24 * 60 + jstNow.minutesOfDay;
          if (currentExtended < prevClose) {
            const remaining = prevClose - currentExtended;
            return {
              ...base,
              effectiveHours: prevResolution.effectiveHours,
              isSpecialHours: prevResolution.isSpecialHours,
              status: remaining <= 60 ? 'closing_soon' : 'open',
              minutesUntilClose: remaining,
              isFromPreviousBusinessDay: true,
            };
          }
        }
      }

      if (resolution.closedReason) {
        return {
          ...base,
          status: resolution.closedReason,
        };
      }

      const openMin = parseTimeToMinutes(resolution.effectiveHours!.open);
      const closeMin = parseTimeToMinutes(resolution.effectiveHours!.close);
      const cur = jstNow.minutesOfDay;

      if (cur >= openMin && cur < closeMin) {
        const remaining = closeMin - cur;
        return {
          ...base,
          status: remaining <= 60 ? 'closing_soon' : 'open',
          minutesUntilClose: remaining,
        };
      }

      if (cur < openMin) {
        const untilOpen = openMin - cur;
        return {
          ...base,
          status: untilOpen <= 60 ? 'opening_soon' : 'closed_now',
          minutesUntilOpen: untilOpen,
        };
      }

      return {
        ...base,
        status: 'closed_now',
      };
    }
  }

  // Non-today date (or no live clock supplied)
  if (resolution.closedReason) {
    return {
      ...base,
      status: resolution.closedReason,
    };
  }

  return {
    ...base,
    status: 'scheduled_open',
  };
}

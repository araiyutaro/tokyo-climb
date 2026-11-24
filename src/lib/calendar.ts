import type { AreaId, Gym, ScheduleEvent, ScheduleEventType } from './schema';
import { addDaysToDateStr, getJapaneseHolidayName } from './schedule';

export interface CalendarEventItem {
  event: ScheduleEvent;
  gymName: string;
  gymArea: AreaId;
  gymChain?: string;
}

export interface CalendarDayCell {
  dateStr: string;
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sun .. 6 = Sat
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  items: CalendarEventItem[];
  counts: {
    closed: number;
    partial: number;
    hoursChange: number;
    event: number;
  };
}

export interface CalendarFilters {
  todayStr?: string;
  gymIds?: string[];
  areas?: AreaId[];
  types?: ScheduleEventType[];
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildMonthCalendar(
  year: number,
  month: number,
  gyms: Gym[],
  events: ScheduleEvent[],
  filters: CalendarFilters = {},
): CalendarDayCell[] {
  const gymMap = new Map(gyms.map((g) => [g.id, g]));
  const gymIdSet = filters.gymIds ? new Set(filters.gymIds) : null;
  const areaSet = filters.areas && filters.areas.length > 0 ? new Set(filters.areas) : null;
  const typeSet = filters.types && filters.types.length > 0 ? new Set(filters.types) : null;

  const filteredEvents = events.filter((ev) => {
    const gym = gymMap.get(ev.gymId);
    if (!gym) return false;
    if (gymIdSet && !gymIdSet.has(ev.gymId)) return false;
    if (areaSet && !areaSet.has(gym.area)) return false;
    if (typeSet && !typeSet.has(ev.type)) return false;
    return true;
  });

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const firstDow = firstOfMonth.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = lastOfMonth.getUTCDate();

  const firstDateStr = formatDate(year, month, 1);
  const gridStartStr = addDaysToDateStr(firstDateStr, -firstDow);

  const totalDaysNeeded = firstDow + daysInMonth;
  const totalCells = Math.ceil(totalDaysNeeded / 7) * 7;

  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const dateStr = addDaysToDateStr(gridStartStr, i);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeek = i % 7;
    const isCurrentMonth = y === year && m === month;
    const holidayName = getJapaneseHolidayName(dateStr);

    const items: CalendarEventItem[] = [];
    const counts = {
      closed: 0,
      partial: 0,
      hoursChange: 0,
      event: 0,
    };

    for (const ev of filteredEvents) {
      if (ev.startDate <= dateStr && dateStr <= ev.endDate) {
        const gym = gymMap.get(ev.gymId)!;
        items.push({
          event: ev,
          gymName: gym.name,
          gymArea: gym.area,
          gymChain: gym.chain,
        });

        if (ev.type === 'closed' || ev.type === 'hold_change_full') {
          counts.closed += 1;
        } else if (ev.type === 'hold_change_partial') {
          counts.partial += 1;
        } else if (ev.type === 'hours_change') {
          counts.hoursChange += 1;
        } else if (ev.type === 'event') {
          counts.event += 1;
        }
      }
    }

    cells.push({
      dateStr,
      dayOfMonth: d,
      dayOfWeek,
      isCurrentMonth,
      isToday: Boolean(filters.todayStr && filters.todayStr === dateStr),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: Boolean(holidayName),
      holidayName,
      items,
      counts,
    });
  }

  return cells;
}

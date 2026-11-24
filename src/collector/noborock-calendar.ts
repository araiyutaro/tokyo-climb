import crypto from 'crypto';
import * as cheerio from 'cheerio';
import {
  ScheduleEventSchema,
  type Gym,
  type ScheduleEvent,
  type TimeRange,
} from '@/lib/schema';
import { getDayKeyForDateStr, getJapaneseHolidayName } from '@/lib/schedule';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function getRegularHoursForDate(gym: Gym, dateStr: string): TimeRange | null {
  const isHoliday = Boolean(getJapaneseHolidayName(dateStr));
  if (isHoliday) return gym.regularHours.holiday;
  return gym.regularHours[getDayKeyForDateStr(dateStr)];
}

export interface NoborockParseResult {
  events: ScheduleEvent[];
  nextMonthUrl?: string;
}

export function parseNoborockCalendarHtml(
  html: string,
  gym: Gym,
  baseUrl: string,
  fetchedAt: Date = new Date(),
): NoborockParseResult {
  const $ = cheerio.load(html);

  const titleText = $('.ai1ec-calendar-title').first().text().trim();
  const ymMatch = titleText.match(/(\d{1,2})\s*月\s*(\d{4})/);
  if (!ymMatch) {
    return { events: [] };
  }

  const month = Number(ymMatch[1]);
  const year = Number(ymMatch[2]);

  const nextHref = $('.ai1ec-next-month').first().attr('href');
  let nextMonthUrl: string | undefined;
  if (nextHref) {
    try {
      nextMonthUrl = new URL(nextHref, baseUrl).toString();
    } catch {
      nextMonthUrl = undefined;
    }
  }

  const keyword = gym.collector?.storeKeyword;
  const events: ScheduleEvent[] = [];

  $('td:not(.ai1ec-empty)').each((_, td) => {
    const dayRaw = $(td).find('.ai1ec-date').first().text().trim();
    const dayNum = Number(dayRaw);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) return;

    const dateStr = `${year}-${pad2(month)}-${pad2(dayNum)}`;

    $(td)
      .find('.ai1ec-event-title')
      .each((__, titleEl) => {
        const rawTitle = $(titleEl).text().replace(/\s+/g, ' ').trim();
        if (!rawTitle) return;
        if (keyword && !rawTitle.includes(keyword)) return;

        const linkHref = $(titleEl).closest('a').attr('href');
        let eventUrl = baseUrl;
        if (linkHref) {
          try {
            eventUrl = new URL(linkHref, baseUrl).toString();
          } catch {
            eventUrl = baseUrl;
          }
        }

        const regular = getRegularHoursForDate(gym, dateStr);
        const closeMatch = rawTitle.match(/(\d{1,2}):(\d{2})\s*close/i);
        const openMatch = rawTitle.match(/(\d{1,2}):(\d{2})\s*open/i);

        let type: ScheduleEvent['type'] = 'event';
        let specialHours: TimeRange | undefined;

        if (/(ルートセット|ホールド替え|セット)/.test(rawTitle) && /(休業|休み|close)/i.test(rawTitle)) {
          type = 'hold_change_full';
        } else if (/(臨時休業|休業|休館)/.test(rawTitle)) {
          type = 'closed';
        } else if (closeMatch) {
          const closeStr = `${pad2(Number(closeMatch[1]))}:${closeMatch[2]}`;
          const openStr = regular?.open ?? '10:00';
          type = 'hours_change';
          specialHours = { open: openStr, close: closeStr };
        } else if (openMatch) {
          const openStr = `${pad2(Number(openMatch[1]))}:${openMatch[2]}`;
          const closeStr = regular?.close ?? '23:00';
          type = 'hours_change';
          specialHours = { open: openStr, close: closeStr };
        }

        const hash = crypto
          .createHash('sha1')
          .update(`${gym.id}|noborock-cal|${dateStr}|${rawTitle}`)
          .digest('hex')
          .slice(0, 10);

        const parsed = ScheduleEventSchema.safeParse({
          id: `auto-${gym.id}-${dateStr}-${hash}`,
          gymId: gym.id,
          type,
          title: rawTitle,
          startDate: dateStr,
          endDate: dateStr,
          ...(type === 'hours_change' && specialHours ? { specialHours } : {}),
          source: {
            url: eventUrl,
            label: 'NOBOROCK公式カレンダー',
            confidence: 'auto',
            fetchedAt: fetchedAt.toISOString(),
          },
        });

        if (parsed.success) {
          events.push(parsed.data);
        }
      });
  });

  return { events, nextMonthUrl };
}

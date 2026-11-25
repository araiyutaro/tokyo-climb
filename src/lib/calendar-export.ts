import type { Gym, ScheduleEvent } from './schema';
import { addDaysToDateStr } from './schedule';

function toCompactDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildGoogleCalendarUrl(gym: Gym, event: ScheduleEvent): string {
  const exclusiveEnd = addDaysToDateStr(event.endDate, 1);
  const title = `[${gym.name}] ${event.title}`;
  const detailLines = [
    event.description ?? '',
    event.specialHours ? `特別営業時間: ${event.specialHours.open} - ${event.specialHours.close}` : '',
    event.affectedAreas && event.affectedAreas.length > 0
      ? `制限エリア: ${event.affectedAreas.join(', ')}`
      : '',
    `情報元: ${event.source.url}`,
    'Tokyo Climb より登録',
  ].filter(Boolean);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCompactDate(event.startDate)}/${toCompactDate(exclusiveEnd)}`,
    details: detailLines.join('\n'),
    location: gym.address,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(gym: Gym, event: ScheduleEvent): string {
  const exclusiveEnd = addDaysToDateStr(event.endDate, 1);
  const summary = `[${gym.name}] ${event.title}`;
  const description = [event.description ?? '', `情報元: ${event.source.url}`]
    .filter(Boolean)
    .join('\n');
  const dtstamp = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tokyo Climb//Schedule//JA',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@tokyo-climb`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${toCompactDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${toCompactDate(exclusiveEnd)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(gym.address)}`,
    `URL:${event.source.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadIcsFile(gym: Gym, event: ScheduleEvent): void {
  const ics = buildIcsContent(gym, event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${gym.id}-${event.startDate}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import crypto from 'crypto';
import {
  ScheduleEventSchema,
  type ScheduleEvent,
  type ScheduleEventType,
  type TimeRange,
} from '@/lib/schema';
import type { DateRange, ExtractContext, FeedArticle } from './types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

function inferYear(month: number, refDate: Date): number {
  const refYear = refDate.getUTCFullYear();
  const refMonth = refDate.getUTCMonth() + 1;
  // If we are in Nov/Dec and see Jan/Feb/Mar without year, it refers to next year.
  if (refMonth >= 10 && month <= 3) return refYear + 1;
  // If we are in Jan/Feb and see Nov/Dec without year, it refers to previous year.
  if (refMonth <= 2 && month >= 11) return refYear - 1;
  return refYear;
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function extractDateRanges(text: string, referenceDate: Date = new Date()): DateRange[] {
  const normalized = text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[～〜~\-－―–]/g, '〜');

  const ranges: DateRange[] = [];
  const consumedSpans: Array<[number, number]> = [];

  const overlaps = (start: number, end: number) =>
    consumedSpans.some(([s, e]) => start < e && end > s);

  // Pattern 1: Date range e.g. "2026年11月30日（月）〜12月4日（金）" or "12/30(水)〜1/2(土)"
  const rangeRegex =
    /(?:(\d{4})\s*[年/.-]\s*)?(\d{1,2})\s*[月/]\s*(\d{1,2})\s*日?(?:\s*[（(][月火水木金土日祝・\s]+[）)])?\s*〜\s*(?:(\d{4})\s*[年/.-]\s*)?(?:(\d{1,2})\s*[月/]\s*)?(\d{1,2})\s*日?(?:\s*[（(][月火水木金土日祝・\s]+[）)])?/g;

  for (const match of normalized.matchAll(rangeRegex)) {
    const idx = match.index ?? 0;
    const endIdx = idx + match[0].length;
    if (overlaps(idx, endIdx)) continue;

    const startMonth = Number(match[2]);
    const startDay = Number(match[3]);
    const startYear = match[1] ? Number(match[1]) : inferYear(startMonth, referenceDate);

    const endMonth = match[5] ? Number(match[5]) : startMonth;
    const endDay = Number(match[6]);
    let endYear = match[4] ? Number(match[4]) : startYear;
    if (!match[4] && endMonth < startMonth) {
      endYear = startYear + 1;
    }

    if (isValidYmd(startYear, startMonth, startDay) && isValidYmd(endYear, endMonth, endDay)) {
      const startDate = formatYmd(startYear, startMonth, startDay);
      const endDate = formatYmd(endYear, endMonth, endDay);
      if (endDate >= startDate) {
        ranges.push({ startDate, endDate });
        consumedSpans.push([idx, endIdx]);
      }
    }
  }

  // Pattern 2: Consecutive days joined by ・ e.g. "11月28日・29日"
  const dotPairRegex =
    /(?:(\d{4})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日(?:\s*[（(][月火水木金土日祝・\s]+[）)])?\s*[・,、]\s*(\d{1,2})\s*日/g;

  for (const match of normalized.matchAll(dotPairRegex)) {
    const idx = match.index ?? 0;
    const endIdx = idx + match[0].length;
    if (overlaps(idx, endIdx)) continue;

    const month = Number(match[2]);
    const d1 = Number(match[3]);
    const d2 = Number(match[4]);
    const year = match[1] ? Number(match[1]) : inferYear(month, referenceDate);

    if (isValidYmd(year, month, d1) && isValidYmd(year, month, d2) && d2 >= d1) {
      ranges.push({
        startDate: formatYmd(year, month, d1),
        endDate: formatYmd(year, month, d2),
      });
      consumedSpans.push([idx, endIdx]);
    }
  }

  // Pattern 3: Single date e.g. "11月26日（木）" or "2026/11/26"
  const singleRegex =
    /(?:(\d{4})\s*[年/.-]\s*)?(\d{1,2})\s*[月/]\s*(\d{1,2})\s*日?(?:\s*[（(][月火水木金土日祝・\s]+[）)])?/g;

  for (const match of normalized.matchAll(singleRegex)) {
    const idx = match.index ?? 0;
    const endIdx = idx + match[0].length;
    if (overlaps(idx, endIdx)) continue;

    // Avoid matching time fragments like "10/20" unless month/day are clearly date-like or have 月/日/dow
    const raw = match[0];
    const hasDateMarker = /[年月日（(]/.test(raw) || Boolean(match[1]);
    if (!hasDateMarker) continue;

    const month = Number(match[2]);
    const day = Number(match[3]);
    const year = match[1] ? Number(match[1]) : inferYear(month, referenceDate);

    if (isValidYmd(year, month, day)) {
      const dateStr = formatYmd(year, month, day);
      ranges.push({ startDate: dateStr, endDate: dateStr });
      consumedSpans.push([idx, endIdx]);
    }
  }

  return ranges;
}

export function extractSpecialHours(text: string): TimeRange | undefined {
  const normalized = text
    .replace(/[０-９：]/g, (ch) =>
      ch === '：' ? ':' : String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .replace(/[～〜~\-－―–]/g, '〜');

  const match = normalized.match(/(\d{1,2}):(\d{2})\s*〜\s*(\d{1,2}):(\d{2})/);
  if (!match) return undefined;

  const oh = Number(match[1]);
  const om = Number(match[2]);
  const ch = Number(match[3]);
  const cm = Number(match[4]);

  if (oh > 23 || om > 59 || ch > 30 || cm > 59) return undefined;
  if (ch * 60 + cm <= oh * 60 + om) return undefined;

  return {
    open: `${pad2(oh)}:${pad2(om)}`,
    close: `${pad2(ch)}:${pad2(cm)}`,
  };
}

function classifyEventType(
  combinedText: string,
  specialHours?: TimeRange,
): ScheduleEventType | null {
  const hasHoldChange =
    /(ホールド替え|ホールドチェンジ|ホールド外し|ルートセット|リニューアルセット|全壁セット|全面セット|セット作業|壁セット)/.test(
      combinedText,
    );
  const hasFullClosureWords =
    /(全面ホールド替え|全館休業|終日休業|臨時休業|お休み|休業いたします|休業となります|クローズとなります|メンテナンス休業|休館)/.test(
      combinedText,
    );
  const hasPartialHint =
    /(一部|エリア制限|通常営業|他エリア|B Wall|D Wall|Concept Wall|120度|スラブ|リードエリア|2F|3F|4F|1F)/.test(
      combinedText,
    );
  const hasHoursChange = /(時短営業|短縮営業|営業時間変更|特別営業|オープン時間変更|閉店時間変更)/.test(
    combinedText,
  );
  const hasEventKeyword =
    /(コンペ|セッション|イベント|試し履き|Summit|Festival|フェスティバル|体験会|講習会|貸切)/.test(
      combinedText,
    );

  if (hasHoldChange) {
    if (
      (/(全面ホールド替え|全壁セット|全面セット)/.test(combinedText) || hasFullClosureWords) &&
      !hasPartialHint
    ) {
      return 'hold_change_full';
    }
    return 'hold_change_partial';
  }

  if (hasHoursChange && specialHours) {
    return 'hours_change';
  }

  if (/(臨時休業|全館休業|終日休業|メンテナンス休業|年末年始休業|休館)/.test(combinedText)) {
    return 'closed';
  }

  if (hasEventKeyword) {
    return 'event';
  }

  return null;
}

export function extractScheduleEventFromArticle(
  article: FeedArticle,
  context: ExtractContext,
  referenceDate: Date = new Date(),
): ScheduleEvent | null {
  const combined = `${article.title} ${article.body}`;

  // For multi-store chains, require storeKeyword when configured
  if (context.storeKeyword && !combined.includes(context.storeKeyword)) {
    return null;
  }

  const ranges = extractDateRanges(combined, referenceDate);
  if (ranges.length === 0) return null;

  const specialHours = extractSpecialHours(combined);
  const type = classifyEventType(combined, specialHours);
  if (!type) return null;

  const primaryRange = ranges[0];
  const hash = crypto
    .createHash('sha1')
    .update(`${context.gymId}|${article.url}|${primaryRange.startDate}|${article.title}`)
    .digest('hex')
    .slice(0, 10);

  const candidate = {
    id: `auto-${context.gymId}-${primaryRange.startDate}-${hash}`,
    gymId: context.gymId,
    type,
    title: article.title.trim().slice(0, 120),
    description: article.body.trim().slice(0, 220) || undefined,
    startDate: primaryRange.startDate,
    endDate: primaryRange.endDate,
    ...(type === 'hours_change' && specialHours ? { specialHours } : {}),
    source: {
      url: article.url,
      label: context.sourceLabel,
      confidence: 'auto' as const,
      fetchedAt: referenceDate.toISOString(),
    },
  };

  const parsed = ScheduleEventSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

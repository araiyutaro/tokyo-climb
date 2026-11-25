import { AREA_OPTIONS, type AreaId, type DayKey, type ScheduleEventType, type TimeRange } from './schema';
import type { LiveGymStatus } from './schedule';

export const AREA_LABEL_MAP: Record<AreaId, string> = Object.fromEntries(
  AREA_OPTIONS.map((a) => [a.id, a.label]),
) as Record<AreaId, string>;

export const DAY_LABEL_JA: Record<DayKey, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
  holiday: '祝',
};

export function formatTimeRange(range: TimeRange | null): string {
  if (!range) return '定休日';
  return `${range.open} – ${range.close}`;
}

export function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getUTCDay()];
  return `${m}/${d}(${dow})`;
}

export function formatDateRangeJa(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDateJa(startDate);
  return `${formatDateJa(startDate)} 〜 ${formatDateJa(endDate)}`;
}

export function getStatusMeta(status: LiveGymStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
  sortWeight: number;
} {
  switch (status) {
    case 'open':
      return {
        label: '営業中',
        badgeClass:
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30',
        dotClass: 'bg-emerald-500 animate-pulse',
        sortWeight: 1,
      };
    case 'closing_soon':
      return {
        label: 'まもなく閉店',
        badgeClass:
          'bg-amber-50 text-amber-800 ring-1 ring-amber-600/25 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-500/30',
        dotClass: 'bg-amber-500 animate-pulse',
        sortWeight: 2,
      };
    case 'opening_soon':
      return {
        label: 'まもなく開店',
        badgeClass:
          'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-500/30',
        dotClass: 'bg-sky-500',
        sortWeight: 3,
      };
    case 'scheduled_open':
      return {
        label: '営業予定',
        badgeClass:
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-500/30',
        dotClass: 'bg-emerald-500',
        sortWeight: 1,
      };
    case 'closed_now':
      return {
        label: '営業時間外',
        badgeClass:
          'bg-slate-100 text-slate-600 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
        dotClass: 'bg-slate-400',
        sortWeight: 4,
      };
    case 'regular_closed':
      return {
        label: '定休日',
        badgeClass:
          'bg-slate-100 text-slate-600 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
        dotClass: 'bg-slate-400',
        sortWeight: 5,
      };
    case 'temp_closed':
      return {
        label: '臨時休業',
        badgeClass:
          'bg-rose-50 text-rose-700 ring-1 ring-rose-600/25 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-500/30',
        dotClass: 'bg-rose-500',
        sortWeight: 6,
      };
    case 'hold_change_closed':
      return {
        label: 'ホールド替え休業',
        badgeClass:
          'bg-rose-100 text-rose-800 ring-1 ring-rose-600/30 dark:bg-rose-950/80 dark:text-rose-200 dark:ring-rose-500/40',
        dotClass: 'bg-rose-600',
        sortWeight: 7,
      };
  }
}

export function getEventTypeMeta(type: ScheduleEventType): {
  label: string;
  shortLabel: string;
  pillClass: string;
  cardClass: string;
  dotClass: string;
} {
  switch (type) {
    case 'hold_change_full':
      return {
        label: '全面ホールド替え休業',
        shortLabel: '全面セット休',
        pillClass:
          'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800/70',
        cardClass:
          'bg-rose-50/90 border-rose-200 text-rose-900 dark:bg-rose-950/45 dark:border-rose-800/60 dark:text-rose-100',
        dotClass: 'bg-rose-600',
      };
    case 'closed':
      return {
        label: '臨時休業',
        shortLabel: '臨時休業',
        pillClass:
          'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800/70',
        cardClass:
          'bg-rose-50/90 border-rose-200 text-rose-900 dark:bg-rose-950/45 dark:border-rose-800/60 dark:text-rose-100',
        dotClass: 'bg-rose-500',
      };
    case 'hold_change_partial':
      return {
        label: '一部壁ホールド替え',
        shortLabel: '一部セット',
        pillClass:
          'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-800/70',
        cardClass:
          'bg-orange-50/90 border-orange-200 text-orange-950 dark:bg-orange-950/45 dark:border-orange-800/60 dark:text-orange-100',
        dotClass: 'bg-orange-500',
      };
    case 'hours_change':
      return {
        label: '時短・特別営業',
        shortLabel: '営業時間変更',
        pillClass:
          'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-800/70',
        cardClass:
          'bg-indigo-50/90 border-indigo-200 text-indigo-950 dark:bg-indigo-950/45 dark:border-indigo-800/60 dark:text-indigo-100',
        dotClass: 'bg-indigo-500',
      };
    case 'event':
      return {
        label: 'イベント・コンペ',
        shortLabel: 'イベント',
        pillClass:
          'bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800/70',
        cardClass:
          'bg-violet-50/90 border-violet-200 text-violet-950 dark:bg-violet-950/45 dark:border-violet-800/60 dark:text-violet-100',
        dotClass: 'bg-violet-500',
      };
  }
}

export function getConfidenceLabel(confidence: 'verified' | 'auto' | 'ai_extracted'): string {
  switch (confidence) {
    case 'verified':
      return '確認済';
    case 'auto':
      return '公式自動取得';
    case 'ai_extracted':
      return 'AI抽出（公式要確認）';
  }
}

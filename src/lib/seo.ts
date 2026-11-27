import { AREA_OPTIONS, type AreaId, type DayKey, type Gym, type ScheduleEvent } from './schema';
import {
  addDaysToDateStr,
  evaluateGymDayStatus,
  parseTimeToMinutes,
  type GymDayStatus,
} from './schedule';
import { formatTimeRange, getStatusMeta } from './ui-helpers';

export interface AreaSeoMeta {
  id: AreaId;
  label: string;
  title: string;
  description: string;
  lead: string;
}

export const AREA_SEO_META: Record<AreaId, AreaSeoMeta> = {
  'shinjuku-shibuya': {
    id: 'shinjuku-shibuya',
    label: '新宿・渋谷',
    title: '新宿・渋谷のボルダリングジム営業時間・ホールド替えまとめ',
    description:
      '新宿・渋谷・原宿・代々木エリアのボルダリングジムの今日の営業状況、最終ホールド替え日、今後のセット替え休業予定を一覧で比較できます。',
    lead: '仕事帰りや週末にアクセス抜群な新宿・渋谷・高田馬場エリアの主要ボルダリングジムをまとめました。',
  },
  'ikebukuro-north': {
    id: 'ikebukuro-north',
    label: '池袋・城北・練馬',
    title: '池袋・城北・練馬のボルダリングジム営業時間・ホールド替えまとめ',
    description:
      '池袋・板橋・練馬・赤羽など城北エリアのボルダリングジムのリアルタイム営業状況とホールド替え予定をまとめて確認できます。',
    lead: '大型ジムや常連に愛される実力派ジムが集まる池袋・練馬・城北エリアの店舗一覧です。',
  },
  'akiba-east': {
    id: 'akiba-east',
    label: '秋葉原・城東',
    title: '秋葉原・城東エリアのボルダリングジム営業時間・ホールド替えまとめ',
    description:
      '秋葉原・神田・錦糸町・東陽町・大手町など城東エリアのボルダリングジムの営業時間とホールド替え予定を一括チェック。',
    lead: 'B-PUMP TOKYO（秋葉原）や大型ロッキー系をはじめ、都心東側で通いやすいジムを網羅しています。',
  },
  'minato-shinagawa': {
    id: 'minato-shinagawa',
    label: '港区・品川',
    title: '港区・品川エリアのボルダリングジム営業時間・ホールド替えまとめ',
    description:
      '品川・田町・目黒・五反田・大井町など港区・品川エリアのボルダリングジムの今日の営業状況とホールド替え情報をまとめています。',
    lead: 'ビジネス街から仕事終わりに立ち寄りやすい港区・品川・目黒周辺のジム一覧です。',
  },
  'chuo-west': {
    id: 'chuo-west',
    label: '中央線・杉並・西東京',
    title: '中央線（荻窪・吉祥寺・三鷹・西東京）のボルダリングジムまとめ',
    description:
      '荻窪・吉祥寺・三鷹・中野など中央線沿線・杉並・西東京エリアのボルダリングジムの営業時間・最終ホールド替え日・深夜営業情報を一覧比較。',
    lead: 'B-PUMP 荻窪、三鷹ジム、ジャムセッションなど名門・独立系ジムがひしめく中央線沿線の激戦区エリアです。',
  },
  tama: {
    id: 'tama',
    label: '多摩・調布・府中・立川・八王子',
    title: '多摩・調布・府中・立川・八王子のボルダリングジムまとめ',
    description:
      '調布・府中・町田・立川・八王子など多摩エリアのボルダリングジムの営業時間とホールド替え予定を一覧で確認できます。',
    lead: '広い空間と駐車場・好アクセスを備えた多摩エリア（WESTROCK・NOBOROCK・独立系）の店舗一覧です。',
  },
  'kanagawa-saitama': {
    id: 'kanagawa-saitama',
    label: '神奈川・埼玉・千葉（近郊）',
    title: '神奈川・埼玉・千葉（東京近郊）のボルダリングジムまとめ',
    description:
      '川崎・横浜・入間・川口・船橋など東京近郊の大型ボルダリングジムの営業時間・ホールド替え予定をまとめて比較できます。',
    lead: 'PUMP2 川崎、Base Camp、BOULCOM 川崎、船橋ロッキーなど遠征価値の高い東京近郊の名門ジム一覧です。',
  },
};

const ALL_DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

export function getLatestCloseTime(gym: Gym): string | null {
  let bestClose: string | null = null;
  let bestMinutes = -1;
  for (const dk of ALL_DAY_KEYS) {
    const range = gym.regularHours[dk];
    if (!range) continue;
    const mins = parseTimeToMinutes(range.close);
    if (mins > bestMinutes) {
      bestMinutes = mins;
      bestClose = range.close;
    }
  }
  return bestClose;
}

export function isLateNightOr24hGym(gym: Gym): boolean {
  if (gym.is24HoursForMembers) return true;
  const latest = getLatestCloseTime(gym);
  if (!latest) return false;
  return parseTimeToMinutes(latest) >= 23 * 60;
}

export function getRecentHoldChangeGyms(
  gyms: Gym[],
  events: ScheduleEvent[],
  dateStr: string,
  withinDays = 30,
  now?: Date,
): GymDayStatus[] {
  return gyms
    .map((gym) => evaluateGymDayStatus(gym, dateStr, events, now))
    .filter(
      (ds) => ds.lastHoldChange !== undefined && ds.lastHoldChange.daysAgo <= withinDays,
    )
    .sort((a, b) => {
      const dA = a.lastHoldChange!.daysAgo;
      const dB = b.lastHoldChange!.daysAgo;
      if (dA !== dB) return dA - dB;
      return a.gym.name.localeCompare(b.gym.name, 'ja');
    });
}

export interface UpcomingGymEventItem {
  gym: Gym;
  event: ScheduleEvent;
}

export function getUpcomingHoldChangeEvents(
  gyms: Gym[],
  events: ScheduleEvent[],
  fromDateStr: string,
  daysAhead = 60,
): UpcomingGymEventItem[] {
  const gymMap = new Map(gyms.map((g) => [g.id, g]));
  const horizonEnd = addDaysToDateStr(fromDateStr, daysAhead);

  return events
    .filter(
      (ev) =>
        (ev.type === 'hold_change_full' ||
          ev.type === 'hold_change_partial' ||
          ev.type === 'closed') &&
        ev.endDate >= fromDateStr &&
        ev.startDate <= horizonEnd &&
        gymMap.has(ev.gymId),
    )
    .map((event) => ({
      gym: gymMap.get(event.gymId)!,
      event,
    }))
    .sort((a, b) => {
      if (a.event.startDate !== b.event.startDate) {
        return a.event.startDate.localeCompare(b.event.startDate);
      }
      return a.gym.name.localeCompare(b.gym.name, 'ja');
    });
}

export function buildGymShareText(dayStatus: GymDayStatus): string {
  const { gym, status, effectiveHours, lastHoldChange } = dayStatus;
  const statusLabel = getStatusMeta(status).label;
  const hoursPart = effectiveHours ? `本日 ${formatTimeRange(effectiveHours)}` : statusLabel;
  const setPart = lastHoldChange
    ? `｜最終ホールド替え ${
        lastHoldChange.daysAgo === 0
          ? '本日'
          : lastHoldChange.daysAgo === 1
            ? '昨日'
            : `${lastHoldChange.daysAgo}日前`
      }`
    : '';
  return `${gym.name}（${gym.nearestStation}）｜${hoursPart}・${statusLabel}${setPart} #TokyoClimb #ボルダリング`;
}

export function buildBreadcrumbJsonLd(
  siteUrl: string,
  items: Array<{ name: string; path: string }>,
) {
  const normalizedBase = siteUrl.replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === '/' ? `${normalizedBase}/` : `${normalizedBase}${item.path}`,
    })),
  };
}

export function getAreaOptionById(areaId: string) {
  return AREA_OPTIONS.find((a) => a.id === areaId);
}

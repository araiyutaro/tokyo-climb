import { z } from 'zod';

export const AREA_OPTIONS = [
  { id: 'shinjuku-shibuya', label: '新宿・渋谷' },
  { id: 'ikebukuro-north', label: '池袋・城北・練馬' },
  { id: 'akiba-east', label: '秋葉原・城東' },
  { id: 'minato-shinagawa', label: '港区・品川' },
  { id: 'chuo-west', label: '中央線・杉並・西東京' },
  { id: 'tama', label: '多摩・調布・府中・立川・八王子' },
  { id: 'kanagawa-saitama', label: '神奈川・埼玉（近郊）' },
] as const;

export const AreaIdSchema = z.enum([
  'shinjuku-shibuya',
  'ikebukuro-north',
  'akiba-east',
  'minato-shinagawa',
  'chuo-west',
  'tama',
  'kanagawa-saitama',
]);

export type AreaId = z.infer<typeof AreaIdSchema>;

export const DayKeySchema = z.enum([
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
  'holiday',
]);

export type DayKey = z.infer<typeof DayKeySchema>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const OPEN_TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CLOSE_TIME_REGEX = /^(?:[01]\d|2\d|30):[0-5]\d$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const TimeRangeSchema = z
  .object({
    open: z.string().regex(OPEN_TIME_REGEX, 'open must be HH:MM (00:00-23:59)'),
    close: z.string().regex(CLOSE_TIME_REGEX, 'close must be HH:MM (00:01-30:00)'),
  })
  .refine((val) => toMinutes(val.close) > toMinutes(val.open), {
    message: 'close time must be later than open time',
  });

export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const WeeklyHoursSchema = z.object({
  mon: TimeRangeSchema.nullable(),
  tue: TimeRangeSchema.nullable(),
  wed: TimeRangeSchema.nullable(),
  thu: TimeRangeSchema.nullable(),
  fri: TimeRangeSchema.nullable(),
  sat: TimeRangeSchema.nullable(),
  sun: TimeRangeSchema.nullable(),
  holiday: TimeRangeSchema.nullable(),
});

export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

export const GymLinksSchema = z.object({
  website: z.string().url(),
  scheduleUrl: z.string().url().optional(),
  instagram: z.string().url().optional(),
  x: z.string().url().optional(),
  googleMaps: z.string().url().optional(),
});

export const CollectorConfigSchema = z.object({
  adapter: z.enum([
    'wordpress-rss',
    'wordpress-rest',
    'html-news',
    'noborock-calendar',
    'google-calendar-ics',
    'calendar-image',
    'manual-only',
  ]),
  feedUrl: z.string().url().optional(),
  storeKeyword: z.string().optional(),
});

export const GymSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().optional(),
  chain: z.string().optional(),
  area: AreaIdSchema,
  prefecture: z.enum(['東京都', '神奈川県', '埼玉県', '千葉県']),
  address: z.string().min(1),
  nearestStation: z.string().min(1),
  regularHours: WeeklyHoursSchema,
  memberHoursNote: z.string().optional(),
  is24HoursForMembers: z.boolean().optional(),
  notes: z.string().optional(),
  links: GymLinksSchema,
  collector: CollectorConfigSchema.optional(),
});

export type Gym = z.infer<typeof GymSchema>;

export const ScheduleEventTypeSchema = z.enum([
  'closed',
  'hold_change_full',
  'hold_change_partial',
  'hours_change',
  'event',
]);

export type ScheduleEventType = z.infer<typeof ScheduleEventTypeSchema>;

export const EventSourceSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1),
  confidence: z.enum(['verified', 'auto', 'ai_extracted']),
  fetchedAt: z.string().min(1),
});

export const ScheduleEventSchema = z
  .object({
    id: z.string().min(1),
    gymId: z.string().min(1),
    type: ScheduleEventTypeSchema,
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().regex(DATE_REGEX, 'startDate must be YYYY-MM-DD'),
    endDate: z.string().regex(DATE_REGEX, 'endDate must be YYYY-MM-DD'),
    specialHours: TimeRangeSchema.optional(),
    affectedAreas: z.array(z.string()).optional(),
    source: EventSourceSchema,
  })
  .refine((val) => val.endDate >= val.startDate, {
    message: 'endDate must be on or after startDate',
  })
  .refine((val) => val.type !== 'hours_change' || Boolean(val.specialHours), {
    message: 'specialHours is required when type is hours_change',
  });

export type ScheduleEvent = z.infer<typeof ScheduleEventSchema>;

export const GymsFileSchema = z.object({
  updatedAt: z.string().min(1),
  gyms: z.array(GymSchema),
});

export const CollectorRunMetaSchema = z.object({
  gymId: z.string(),
  status: z.enum(['ok', 'error', 'skipped']),
  eventsFound: z.number().int().nonnegative(),
  checkedAt: z.string(),
  message: z.string().optional(),
});

export type CollectorRunMeta = z.infer<typeof CollectorRunMetaSchema>;

export const EventsFileSchema = z.object({
  updatedAt: z.string().min(1),
  events: z.array(ScheduleEventSchema),
  syncStatus: z.array(CollectorRunMetaSchema).optional(),
});

import {
  EventsFileSchema,
  ScheduleEventSchema,
  type ScheduleEvent,
} from './schema';

export function upsertOverrideEvent(
  existing: ScheduleEvent[],
  newEvent: ScheduleEvent,
): ScheduleEvent[] {
  const validated = ScheduleEventSchema.parse(newEvent);
  const byId = new Map(existing.map((e) => [e.id, e]));
  byId.set(validated.id, validated);
  return Array.from(byId.values()).sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
    return a.id.localeCompare(b.id);
  });
}

export function removeOverrideEvent(
  existing: ScheduleEvent[],
  eventId: string,
): ScheduleEvent[] {
  return existing.filter((e) => e.id !== eventId);
}

export function serializeOverridesFile(events: ScheduleEvent[], now: Date = new Date()): string {
  const validated = EventsFileSchema.parse({
    updatedAt: now.toISOString(),
    events,
  });
  return `${JSON.stringify(validated, null, 2)}\n`;
}

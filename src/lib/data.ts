import gymsJson from '../../data/gyms.json';
import eventsJson from '../../data/events.json';
import overridesJson from '../../data/overrides.json';
import {
  EventsFileSchema,
  GymsFileSchema,
  type CollectorRunMeta,
  type Gym,
  type ScheduleEvent,
} from './schema';
import { mergeEvents } from './schedule';

export interface LoadedDataset {
  gyms: Gym[];
  events: ScheduleEvent[];
  gymsUpdatedAt: string;
  eventsUpdatedAt: string;
  syncStatus: CollectorRunMeta[];
}

export function loadDataset(): LoadedDataset {
  const gymsFile = GymsFileSchema.parse(gymsJson);
  const eventsFile = EventsFileSchema.parse(eventsJson);
  const overridesFile = EventsFileSchema.parse(overridesJson);

  return {
    gyms: gymsFile.gyms,
    events: mergeEvents(eventsFile.events, overridesFile.events),
    gymsUpdatedAt: gymsFile.updatedAt,
    eventsUpdatedAt: eventsFile.updatedAt,
    syncStatus: eventsFile.syncStatus ?? [],
  };
}

import fs from 'fs';
import path from 'path';
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

function readDataJsonSafe(
  fileName: 'gyms.json' | 'events.json' | 'overrides.json',
  fallback: unknown,
): unknown {
  try {
    const fullPath = path.join(process.cwd(), 'data', fileName);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    }
  } catch {
    // Fall back to statically bundled JSON
  }
  return fallback;
}

export function loadDataset(): LoadedDataset {
  const gymsFile = GymsFileSchema.parse(readDataJsonSafe('gyms.json', gymsJson));
  const eventsFile = EventsFileSchema.parse(readDataJsonSafe('events.json', eventsJson));
  const overridesEvents = EventsFileSchema.parse(
    readDataJsonSafe('overrides.json', overridesJson),
  ).events;

  return {
    gyms: gymsFile.gyms,
    events: mergeEvents(eventsFile.events, overridesEvents),
    gymsUpdatedAt: gymsFile.updatedAt,
    eventsUpdatedAt: eventsFile.updatedAt,
    syncStatus: eventsFile.syncStatus ?? [],
  };
}

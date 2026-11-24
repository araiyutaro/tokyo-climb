import fs from 'fs/promises';
import path from 'path';
import {
  EventsFileSchema,
  GymsFileSchema,
  type CollectorRunMeta,
  type Gym,
  type ScheduleEvent,
} from '../src/lib/schema';
import { parseFeedXml, parseHtmlNewsPage } from '../src/collector/rss-parser';
import { extractScheduleEventFromArticle } from '../src/collector/text-extractor';
import { extractWithGemini } from '../src/collector/llm-extractor';
import type { FeedArticle } from '../src/collector/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const GYMS_PATH = path.join(DATA_DIR, 'gyms.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events.json');

const USER_AGENT = 'TokyoClimbBot/1.0 (+https://github.com/tokyo-climb; personal schedule aggregator)';

async function fetchTextWithTimeout(url: string, timeoutMs = 12_000): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function collectForGym(
  gym: Gym,
  feedCache: Map<string, Promise<string>>,
  now: Date,
): Promise<{ events: ScheduleEvent[]; meta: CollectorRunMeta }> {
  const cfg = gym.collector;
  const checkedAt = now.toISOString();

  if (!cfg || cfg.adapter === 'manual-only' || !cfg.feedUrl) {
    return {
      events: [],
      meta: {
        gymId: gym.id,
        status: 'skipped',
        eventsFound: 0,
        checkedAt,
        message: 'Manual-only or no feed URL configured',
      },
    };
  }

  try {
    let fetchPromise = feedCache.get(cfg.feedUrl);
    if (!fetchPromise) {
      fetchPromise = fetchTextWithTimeout(cfg.feedUrl);
      feedCache.set(cfg.feedUrl, fetchPromise);
    }
    const raw = await fetchPromise;

    let articles: FeedArticle[] = [];
    if (cfg.adapter === 'wordpress-rss') {
      articles = parseFeedXml(raw);
      if (articles.length === 0) {
        articles = parseHtmlNewsPage(raw, cfg.feedUrl);
      }
    } else if (cfg.adapter === 'html-news') {
      articles = parseHtmlNewsPage(raw, cfg.feedUrl);
    }

    const found: ScheduleEvent[] = [];
    const seenKeys = new Set<string>();
    const context = {
      gymId: gym.id,
      sourceLabel: cfg.adapter === 'wordpress-rss' ? '公式サイトRSS' : '公式サイトお知らせ',
      storeKeyword: cfg.storeKeyword,
    };

    for (const article of articles.slice(0, 15)) {
      let ev = extractScheduleEventFromArticle(article, context, now);
      if (!ev && process.env.GEMINI_API_KEY) {
        ev = await extractWithGemini(article, context, now);
      }
      if (ev) {
        const key = `${ev.gymId}|${ev.type}|${ev.startDate}|${ev.endDate}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          found.push(ev);
        }
      }
    }

    return {
      events: found,
      meta: {
        gymId: gym.id,
        status: 'ok',
        eventsFound: found.length,
        checkedAt,
      },
    };
  } catch (err) {
    return {
      events: [],
      meta: {
        gymId: gym.id,
        status: 'error',
        eventsFound: 0,
        checkedAt,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

async function main() {
  const now = new Date();
  const gymsRaw = JSON.parse(await fs.readFile(GYMS_PATH, 'utf8'));
  const gymsFile = GymsFileSchema.parse(gymsRaw);

  let existingVerified: ScheduleEvent[] = [];
  try {
    const existingRaw = JSON.parse(await fs.readFile(EVENTS_PATH, 'utf8'));
    const existingFile = EventsFileSchema.parse(existingRaw);
    existingVerified = existingFile.events.filter((e) => e.source.confidence === 'verified');
  } catch {
    existingVerified = [];
  }

  console.log(`Collecting schedules for ${gymsFile.gyms.length} gyms...`);
  const feedCache = new Map<string, Promise<string>>();

  const results = await Promise.all(
    gymsFile.gyms.map((gym) => collectForGym(gym, feedCache, now)),
  );

  const collectedEvents = results.flatMap((r) => r.events);
  const syncStatus = results.map((r) => r.meta);

  // Merge: keep verified events, add newly collected non-duplicate auto/ai events
  const mergedMap = new Map<string, ScheduleEvent>();
  for (const ev of collectedEvents) {
    const dedupeKey = `${ev.gymId}|${ev.type}|${ev.startDate}|${ev.endDate}`;
    mergedMap.set(dedupeKey, ev);
  }
  for (const ev of existingVerified) {
    const dedupeKey = `${ev.gymId}|${ev.type}|${ev.startDate}|${ev.endDate}`;
    mergedMap.set(dedupeKey, ev);
  }

  const finalEvents = Array.from(mergedMap.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  const output = EventsFileSchema.parse({
    updatedAt: now.toISOString(),
    events: finalEvents,
    syncStatus,
  });

  await fs.writeFile(EVENTS_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const okCount = syncStatus.filter((s) => s.status === 'ok').length;
  const errCount = syncStatus.filter((s) => s.status === 'error').length;
  console.log(
    `Done! OK: ${okCount}, Errors: ${errCount}, Total events stored: ${finalEvents.length}`,
  );
  for (const s of syncStatus) {
    if (s.status === 'error') {
      console.warn(`  [ERROR] ${s.gymId}: ${s.message}`);
    } else if (s.eventsFound > 0) {
      console.log(`  [FOUND] ${s.gymId}: ${s.eventsFound} events`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { haversineDistanceKm } from './geo';
import type { Gym } from './schema';

const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{10,20}$/;

export interface AdSenseConfig {
  client: string | null;
  slotInfeed: string | null;
  slotDetail: string | null;
}

export function getSiteUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const raw =
    env.NEXT_PUBLIC_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : env.VERCEL_URL
        ? `https://${env.VERCEL_URL}`
        : 'http://localhost:3000');

  return raw.replace(/\/+$/, '');
}

export function isValidAdSenseClient(client?: string | null): client is string {
  if (!client) return false;
  return ADSENSE_CLIENT_PATTERN.test(client.trim());
}

export function getAdSenseConfig(
  env: Record<string, string | undefined> = process.env,
): AdSenseConfig {
  const rawClient = env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const client = isValidAdSenseClient(rawClient) ? rawClient : null;
  const slotInfeed = env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED?.trim() || null;
  const slotDetail = env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL?.trim() || null;

  return { client, slotInfeed, slotDetail };
}

export function buildAdsTxtLine(client?: string | null): string | null {
  if (!isValidAdSenseClient(client)) return null;
  const pubId = client.trim().replace(/^ca-/, '');
  return `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`;
}

export interface NearbyGymItem {
  gym: Gym;
  distanceKm: number;
}

export function findNearbyGyms(
  targetGym: Gym,
  allGyms: Gym[],
  limit = 4,
): NearbyGymItem[] {
  if (!targetGym.coordinates) return [];
  const origin = targetGym.coordinates;

  return allGyms
    .filter((g) => g.id !== targetGym.id && Boolean(g.coordinates))
    .map((gym) => ({
      gym,
      distanceKm: haversineDistanceKm(origin, gym.coordinates!),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

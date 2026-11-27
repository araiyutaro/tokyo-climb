import type { MetadataRoute } from 'next';
import { loadDataset } from '@/lib/data';
import { AREA_OPTIONS } from '@/lib/schema';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const { gyms, eventsUpdatedAt } = loadDataset();
  const lastModified = new Date(eventsUpdatedAt);
  const validLastMod = Number.isNaN(lastModified.getTime()) ? new Date() : lastModified;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: validLastMod,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/hold-changes`,
      lastModified: validLastMod,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/late-night`,
      lastModified: validLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/gear`,
      lastModified: validLastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: validLastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: validLastMod,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const areaPages: MetadataRoute.Sitemap = AREA_OPTIONS.map((area) => ({
    url: `${siteUrl}/areas/${area.id}`,
    lastModified: validLastMod,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  const gymPages: MetadataRoute.Sitemap = gyms.map((gym) => ({
    url: `${siteUrl}/gyms/${gym.id}`,
    lastModified: validLastMod,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticPages, ...areaPages, ...gymPages];
}

import type { MetadataRoute } from 'next';
import { loadDataset } from '@/lib/data';
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

  const gymPages: MetadataRoute.Sitemap = gyms.map((gym) => ({
    url: `${siteUrl}/gyms/${gym.id}`,
    lastModified: validLastMod,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticPages, ...gymPages];
}

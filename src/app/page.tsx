import { loadDataset } from '@/lib/data';
import { TokyoClimbApp } from '@/components/TokyoClimbApp';

// Enable ISR (5 min) so Vercel CDN caches edge HTML and browser bf-cache works cleanly
export const revalidate = 300;

export default function HomePage() {
  const dataset = loadDataset();

  return (
    <TokyoClimbApp
      gyms={dataset.gyms}
      events={dataset.events}
      eventsUpdatedAt={dataset.eventsUpdatedAt}
      syncStatus={dataset.syncStatus}
      initialNowIso={new Date().toISOString()}
    />
  );
}

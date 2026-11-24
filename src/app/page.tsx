import { loadDataset } from '@/lib/data';
import { TokyoClimbApp } from '@/components/TokyoClimbApp';

export const dynamic = 'force-dynamic';

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

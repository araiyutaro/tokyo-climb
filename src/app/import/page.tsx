import { loadDataset, loadOverridesOnly } from '@/lib/data';
import { getJstDateParts } from '@/lib/schedule';
import { QuickImportClient } from '@/components/QuickImportClient';

export const dynamic = 'force-dynamic';

export default function ImportPage() {
  const dataset = loadDataset();
  const overrides = loadOverridesOnly();
  const todayStr = getJstDateParts(new Date()).dateStr;

  return (
    <QuickImportClient
      gyms={dataset.gyms}
      initialOverrides={overrides}
      todayStr={todayStr}
    />
  );
}

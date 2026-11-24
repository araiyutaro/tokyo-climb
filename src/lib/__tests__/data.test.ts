import { describe, it, expect } from 'vitest';
import { loadDataset } from '../data';

describe('data integrity', () => {
  it('loads and validates all 28 configured Tokyo & nearby gyms with unique IDs', () => {
    const dataset = loadDataset();
    expect(dataset.gyms.length).toBeGreaterThanOrEqual(27);

    const ids = new Set(dataset.gyms.map((g) => g.id));
    expect(ids.size).toBe(dataset.gyms.length);

    // Ensure key user-requested gyms are present
    const requiredIds = [
      'bpump-ogikubo',
      'bpump-akiba',
      'dbouldering-tachikawa',
      'dbouldering-hachioji',
      'dbouldering-tamachi',
      'dbouldering-yokohama',
      'westrock-chofu',
      'westrock-fuchu',
      'basecamp-shinjuku',
      'basecamp-higashimurayama',
      'basecamp-edogawabashi',
      'basecamp-shinbashi',
      'quail-nerima',
      'girigiri-nishitokyo',
      'nextgen-niiza',
      'fish-and-bird-toyocho',
      'rhino-and-bird-nishinippori',
    ];
    for (const id of requiredIds) {
      expect(ids.has(id), `Expected gym ${id} to be present`).toBe(true);
    }

    for (const gym of dataset.gyms) {
      expect(gym.links.scheduleUrl ?? '').not.toContain('%e3%82%ab%e3%83%ac%e3%83%b3%e3%83%80%e3%83%bc');
    }
  });

  it('ensures every schedule event references a valid gymId', () => {
    const dataset = loadDataset();
    const gymIds = new Set(dataset.gyms.map((g) => g.id));

    for (const ev of dataset.events) {
      expect(gymIds.has(ev.gymId), `Event ${ev.id} references unknown gymId ${ev.gymId}`).toBe(
        true,
      );
    }
  });
});

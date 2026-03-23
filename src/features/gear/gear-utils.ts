import type { GearRegistryItem } from '@/types/domain';

export function normalizeGearQuery(query: string) {
  return query.trim().toLowerCase();
}

export function hasExactGearMatch(items: GearRegistryItem[], query: string) {
  const normalized = normalizeGearQuery(query);
  return items.some((item) => normalizeGearQuery(item.name) === normalized);
}

export function sortGearOptions(items: GearRegistryItem[], recentIds: string[], query: string) {
  const normalized = normalizeGearQuery(query);
  const recentRank = new Map(recentIds.map((id, index) => [id, index]));

  return items
    .filter((item) => {
      if (!normalized) {
        return true;
      }

      return normalizeGearQuery(item.name).includes(normalized);
    })
    .sort((left, right) => {
      const leftRank = recentRank.get(left.id);
      const rightRank = recentRank.get(right.id);

      if (leftRank !== undefined || rightRank !== undefined) {
        if (leftRank === undefined) {
          return 1;
        }

        if (rightRank === undefined) {
          return -1;
        }

        return leftRank - rightRank;
      }

      return left.name.localeCompare(right.name);
    });
}

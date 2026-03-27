import type { GearRegistryItem } from '@/types/domain';

export function normalizeGearQuery(query: string) {
  return query.trim().toLowerCase();
}

export function getGearDisplayName(item: GearRegistryItem) {
  if (item.type === 'camera' && item.nickname) {
    return `${item.nickname} (${item.name})`;
  }

  return item.name;
}

function getGearSearchText(item: GearRegistryItem) {
  const parts = [getGearDisplayName(item), item.name];

  if (item.type === 'camera' && item.nickname) {
    parts.push(item.nickname);
  }

  return parts.join(' ');
}

function splitGearTokens(value: string) {
  return normalizeGearQuery(value)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export function hasExactGearMatch(items: GearRegistryItem[], query: string) {
  const normalized = normalizeGearQuery(query);
  return items.some((item) => normalizeGearQuery(getGearDisplayName(item)) === normalized);
}

function rankGearMatch(item: GearRegistryItem, query: string) {
  const normalizedQuery = normalizeGearQuery(query);
  if (!normalizedQuery) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalizedName = normalizeGearQuery(getGearSearchText(item));
  if (normalizedName === normalizedQuery) {
    return 1000;
  }

  let score = 0;

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 300;
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 180;
  }

  const queryTokens = splitGearTokens(normalizedQuery);
  const nameTokens = splitGearTokens(normalizedName);

  queryTokens.forEach((token) => {
    if (nameTokens.includes(token)) {
      score += 90;
      return;
    }

    if (nameTokens.some((nameToken) => nameToken.startsWith(token) || token.startsWith(nameToken))) {
      score += 45;
    }
  });

  const compactQuery = normalizedQuery.replace(/[^a-z0-9]/g, '');
  const compactName = normalizedName.replace(/[^a-z0-9]/g, '');
  if (compactQuery && compactName.includes(compactQuery)) {
    score += 120;
  }

  return score;
}

export function resolveBestGearMatch(items: GearRegistryItem[], query: string): GearRegistryItem | null {
  const normalized = normalizeGearQuery(query);
  if (!normalized) {
    return null;
  }

  let bestItem: GearRegistryItem | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  items.forEach((item) => {
    const score = rankGearMatch(item, normalized);
    if (score > bestScore) {
      bestItem = item;
      bestScore = score;
      return;
    }

    if (score === bestScore && bestItem && item.name.localeCompare(bestItem.name) < 0) {
      bestItem = item;
    }
  });

  return bestScore > 0 ? bestItem : null;
}

export function sortGearOptions(items: GearRegistryItem[], recentIds: string[], query: string) {
  const normalized = normalizeGearQuery(query);
  const recentRank = new Map(recentIds.map((id, index) => [id, index]));

  return items
    .filter((item) => {
      if (!normalized) {
        return true;
      }

      return normalizeGearQuery(getGearSearchText(item)).includes(normalized);
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

      return getGearDisplayName(left).localeCompare(getGearDisplayName(right));
    });
}

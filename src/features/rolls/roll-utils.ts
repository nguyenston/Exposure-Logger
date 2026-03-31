import type { Roll } from '@/types/domain';

export function derivePushPullLabel(nativeIso: number | null, shotIso: number | null) {
  if (!nativeIso || !shotIso || nativeIso <= 0 || shotIso <= 0) {
    return 'Box speed';
  }

  const stops = Math.log2(shotIso / nativeIso);
  const roundedStops = Math.round(stops * 2) / 2;

  if (roundedStops === 0) {
    return 'Box speed';
  }

  const magnitude = Math.abs(roundedStops);
  const stopLabel = magnitude === 1 ? 'stop' : 'stops';

  return roundedStops > 0 ? `Push ${magnitude} ${stopLabel}` : `Pull ${magnitude} ${stopLabel}`;
}

export function formatIso(nativeIso: number | null, shotIso: number | null) {
  if (nativeIso && shotIso) {
    return `${nativeIso} box / ${shotIso} shot`;
  }

  if (nativeIso) {
    return `Box ISO ${nativeIso}`;
  }

  if (shotIso) {
    return `Shot ISO ${shotIso}`;
  }

  return 'ISO not set';
}

export function groupRollsByStatus(rolls: Roll[]) {
  return {
    active: rolls.filter((roll) => roll.status === 'active'),
    finished: rolls.filter((roll) => roll.status === 'finished'),
    archived: rolls.filter((roll) => roll.status === 'archived'),
  };
}

export function pickDefaultRoll(rolls: Roll[]) {
  const byRecentUpdate = [...rolls].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );

  return byRecentUpdate.find((roll) => roll.status === 'active') ?? byRecentUpdate[0] ?? null;
}

export function pickHomeRoll(rolls: Roll[], lastOpenedRollId: string | null) {
  if (lastOpenedRollId) {
    const rememberedRoll = rolls.find((roll) => roll.id === lastOpenedRollId);
    if (rememberedRoll) {
      return rememberedRoll;
    }
  }

  return pickDefaultRoll(rolls);
}

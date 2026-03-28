import type { Roll, RollStatus } from '@/types/domain';

export type RollSearchCriteria = {
  query: string;
  status: RollStatus[];
  camera: string[];
  filmStock: string[];
  shotIsoMin: string;
  shotIsoMax: string;
  startedFrom: string;
  startedTo: string;
  finishedFrom: string;
  finishedTo: string;
};

export type RollFilterChip = {
  key: string;
  label: string;
};

export const EMPTY_ROLL_SEARCH_CRITERIA: RollSearchCriteria = {
  query: '',
  status: [],
  camera: [],
  filmStock: [],
  shotIsoMin: '',
  shotIsoMax: '',
  startedFrom: '',
  startedTo: '',
  finishedFrom: '',
  finishedTo: '',
};

/**
 * Converts stored YYYY-MM-DD filter values into a friendlier chip label without
 * changing the lexicographic date format used by the filter logic.
 */
function formatDateChipValue(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function includesText(value: string | null | undefined, query: string) {
  if (!value) {
    return false;
  }

  return value.toLowerCase().includes(query);
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getDatePrefix(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

/**
 * Compares date-only prefixes so roll filters stay stable regardless of the
 * original timestamp's time-of-day component.
 */
function isWithinDateRange(value: string | null | undefined, from: string, to: string) {
  const datePrefix = getDatePrefix(value);
  if (!datePrefix) {
    return !from && !to;
  }

  if (from && datePrefix < from) {
    return false;
  }

  if (to && datePrefix > to) {
    return false;
  }

  return true;
}

/**
 * Applies the current roll-list criteria entirely in memory. This intentionally
 * stays on roll-owned fields instead of reaching into exposure-owned data.
 */
export function filterRolls(rolls: Roll[], criteria: RollSearchCriteria) {
  const normalizedQuery = criteria.query.trim().toLowerCase();
  const shotIsoMin = parseOptionalInteger(criteria.shotIsoMin);
  const shotIsoMax = parseOptionalInteger(criteria.shotIsoMax);

  return rolls.filter((roll) => {
    if (normalizedQuery) {
      const matchesQuery =
        includesText(roll.nickname, normalizedQuery) ||
        includesText(roll.camera, normalizedQuery) ||
        includesText(roll.filmStock, normalizedQuery) ||
        includesText(roll.notes, normalizedQuery);

      if (!matchesQuery) {
        return false;
      }
    }

    if (criteria.status.length > 0 && !criteria.status.includes(roll.status)) {
      return false;
    }

    if (criteria.camera.length > 0 && !criteria.camera.includes(roll.camera)) {
      return false;
    }

    if (criteria.filmStock.length > 0 && !criteria.filmStock.includes(roll.filmStock)) {
      return false;
    }

    if (shotIsoMin !== null && (roll.shotIso === null || roll.shotIso < shotIsoMin)) {
      return false;
    }

    if (shotIsoMax !== null && (roll.shotIso === null || roll.shotIso > shotIsoMax)) {
      return false;
    }

    if (!isWithinDateRange(roll.startedAt, criteria.startedFrom, criteria.startedTo)) {
      return false;
    }

    if (!isWithinDateRange(roll.finishedAt, criteria.finishedFrom, criteria.finishedTo)) {
      return false;
    }

    return true;
  });
}

export function hasActiveRollFilters(criteria: RollSearchCriteria) {
  return (
    criteria.query.trim().length > 0 ||
    criteria.status.length > 0 ||
    criteria.camera.length > 0 ||
    criteria.filmStock.length > 0 ||
    criteria.shotIsoMin.trim().length > 0 ||
    criteria.shotIsoMax.trim().length > 0 ||
    criteria.startedFrom.trim().length > 0 ||
    criteria.startedTo.trim().length > 0 ||
    criteria.finishedFrom.trim().length > 0 ||
    criteria.finishedTo.trim().length > 0
  );
}

/**
 * Builds removable UI chips from the active filter state so each criterion can
 * be cleared independently from the list screen.
 */
export function buildRollFilterChips(criteria: RollSearchCriteria): RollFilterChip[] {
  const chips: RollFilterChip[] = [];

  if (criteria.query.trim()) {
    chips.push({
      key: 'query',
      label: `Search: "${criteria.query.trim()}"`,
    });
  }

  criteria.status.forEach((status) => {
    chips.push({
      key: `status:${status}`,
      label: `Status: ${status}`,
    });
  });

  criteria.camera.forEach((camera) => {
    chips.push({
      key: `camera:${camera}`,
      label: `Camera: ${camera}`,
    });
  });

  criteria.filmStock.forEach((filmStock) => {
    chips.push({
      key: `film:${filmStock}`,
      label: `Film: ${filmStock}`,
    });
  });

  if (criteria.shotIsoMin.trim()) {
    chips.push({
      key: 'shotIsoMin',
      label: `Shot ISO >= ${criteria.shotIsoMin.trim()}`,
    });
  }

  if (criteria.shotIsoMax.trim()) {
    chips.push({
      key: 'shotIsoMax',
      label: `Shot ISO <= ${criteria.shotIsoMax.trim()}`,
    });
  }

  if (criteria.startedFrom.trim()) {
    chips.push({
      key: 'startedFrom',
      label: `Started from: ${formatDateChipValue(criteria.startedFrom.trim())}`,
    });
  }

  if (criteria.startedTo.trim()) {
    chips.push({
      key: 'startedTo',
      label: `Started to: ${formatDateChipValue(criteria.startedTo.trim())}`,
    });
  }

  if (criteria.finishedFrom.trim()) {
    chips.push({
      key: 'finishedFrom',
      label: `Finished from: ${formatDateChipValue(criteria.finishedFrom.trim())}`,
    });
  }

  if (criteria.finishedTo.trim()) {
    chips.push({
      key: 'finishedTo',
      label: `Finished to: ${formatDateChipValue(criteria.finishedTo.trim())}`,
    });
  }

  return chips;
}

/**
 * Removes exactly one active chip from the criteria object without disturbing
 * the rest of the current roll filters.
 */
export function removeRollFilterChip(
  criteria: RollSearchCriteria,
  chipKey: string,
): RollSearchCriteria {
  if (chipKey === 'query') {
    return {
      ...criteria,
      query: '',
    };
  }

  if (chipKey.startsWith('status:')) {
    const status = chipKey.slice('status:'.length) as RollStatus;
    return {
      ...criteria,
      status: criteria.status.filter((value) => value !== status),
    };
  }

  if (chipKey.startsWith('camera:')) {
    const camera = chipKey.slice('camera:'.length);
    return {
      ...criteria,
      camera: criteria.camera.filter((value) => value !== camera),
    };
  }

  if (chipKey.startsWith('film:')) {
    const filmStock = chipKey.slice('film:'.length);
    return {
      ...criteria,
      filmStock: criteria.filmStock.filter((value) => value !== filmStock),
    };
  }

  return {
    ...criteria,
    [chipKey]: '',
  };
}

/**
 * Extracts the distinct registry-backed values shown in the camera and film
 * filter pickers on the rolls screen.
 */
export function getRollFilterOptions(rolls: Roll[]) {
  return {
    cameras: Array.from(new Set(rolls.map((roll) => roll.camera))).sort(),
    filmStocks: Array.from(new Set(rolls.map((roll) => roll.filmStock))).sort(),
  };
}

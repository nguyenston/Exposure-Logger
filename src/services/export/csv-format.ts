import type { Exposure, Roll, RollStatus } from '@/types/domain';
import type { LibraryExportScope } from '@/types/settings';

export type ExportRow = {
  rollId: string;
  rollNickname: string;
  rollStatus: RollStatus;
  camera: string;
  filmStock: string;
  nativeIso: string;
  shotIso: string;
  rollStartedAt: string;
  rollFinishedAt: string;
  rollNotes: string;
  exposureId: string;
  exposureSequenceNumber: string;
  fStop: string;
  shutterSpeed: string;
  lens: string;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  capturedAt: string;
  exposureNotes: string;
};

const EXPORT_HEADERS: (keyof ExportRow)[] = [
  'rollId',
  'rollNickname',
  'rollStatus',
  'camera',
  'filmStock',
  'nativeIso',
  'shotIso',
  'rollStartedAt',
  'rollFinishedAt',
  'rollNotes',
  'exposureId',
  'exposureSequenceNumber',
  'fStop',
  'shutterSpeed',
  'lens',
  'latitude',
  'longitude',
  'locationAccuracy',
  'capturedAt',
  'exposureNotes',
];

function stringifyNullable(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function selectLibraryExportRolls(rolls: Roll[], scope: LibraryExportScope) {
  if (scope === 'finished_and_archived') {
    return rolls.filter((roll) => roll.status === 'finished' || roll.status === 'archived');
  }

  return rolls.filter((roll) => roll.status === 'finished');
}

export function flattenExportRows(rolls: Roll[], exposureMap: Map<string, Exposure[]>) {
  const rows: ExportRow[] = [];

  for (const roll of rolls) {
    const exposures = exposureMap.get(roll.id) ?? [];

    if (exposures.length === 0) {
      rows.push({
        rollId: roll.id,
        rollNickname: roll.nickname ?? '',
        rollStatus: roll.status,
        camera: roll.camera,
        filmStock: roll.filmStock,
        nativeIso: stringifyNullable(roll.nativeIso),
        shotIso: stringifyNullable(roll.shotIso),
        rollStartedAt: stringifyNullable(roll.startedAt),
        rollFinishedAt: stringifyNullable(roll.finishedAt),
        rollNotes: stringifyNullable(roll.notes),
        exposureId: '',
        exposureSequenceNumber: '',
        fStop: '',
        shutterSpeed: '',
        lens: '',
        latitude: '',
        longitude: '',
        locationAccuracy: '',
        capturedAt: '',
        exposureNotes: '',
      });
      continue;
    }

    for (const exposure of exposures) {
      rows.push({
        rollId: roll.id,
        rollNickname: roll.nickname ?? '',
        rollStatus: roll.status,
        camera: roll.camera,
        filmStock: roll.filmStock,
        nativeIso: stringifyNullable(roll.nativeIso),
        shotIso: stringifyNullable(roll.shotIso),
        rollStartedAt: stringifyNullable(roll.startedAt),
        rollFinishedAt: stringifyNullable(roll.finishedAt),
        rollNotes: stringifyNullable(roll.notes),
        exposureId: exposure.id,
        exposureSequenceNumber: stringifyNullable(exposure.sequenceNumber),
        fStop: exposure.fStop,
        shutterSpeed: exposure.shutterSpeed,
        lens: stringifyNullable(exposure.lens),
        latitude: stringifyNullable(exposure.latitude),
        longitude: stringifyNullable(exposure.longitude),
        locationAccuracy: stringifyNullable(exposure.locationAccuracy),
        capturedAt: exposure.capturedAt,
        exposureNotes: stringifyNullable(exposure.notes),
      });
    }
  }

  return rows;
}

export function escapeCsvValue(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export function buildExportCsv(rows: ExportRow[]) {
  const headerLine = EXPORT_HEADERS.join(',');
  const dataLines = rows.map((row) =>
    EXPORT_HEADERS.map((header) => escapeCsvValue(row[header])).join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}

import { computeEv100, formatRoundedEvValue } from '@/features/exposures/exposure-utils';
import { resolveEffectiveExposureLens } from '@/features/gear/gear-utils';
import type { Exposure, GearRegistryItem, Roll, RollStatus } from '@/types/domain';
import type { ExposureStopStep, LibraryExportScope } from '@/types/settings';

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
  ev100: string;
  lens: string;
  lensFocalLength: string;
  flash: string;
  flashPower: string;
  ndStops: string;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  capturedAt: string;
  capturedAtLocal: string;
  capturedAtOffset: string;
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
  'ev100',
  'lens',
  'lensFocalLength',
  'flash',
  'flashPower',
  'ndStops',
  'latitude',
  'longitude',
  'locationAccuracy',
  'capturedAt',
  'capturedAtLocal',
  'capturedAtOffset',
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

function getLensFocalLength(lens: string | null, gearByName: Map<string, GearRegistryItem>) {
  if (!lens) {
    return '';
  }

  const item = gearByName.get(lens);
  if (item?.type !== 'lens') {
    return '';
  }

  return stringifyNullable(item.focalLength);
}

function formatExportEv100(
  fStop: string,
  shutterSpeed: string,
  shotIso: number | null,
  stopStep: ExposureStopStep,
) {
  const ev100 = computeEv100(fStop, shutterSpeed, shotIso);
  return ev100 === null ? '' : formatRoundedEvValue(ev100, stopStep);
}

function parseUtcOffsetMinutes(value: string | null) {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) {
    return null;
  }

  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const totalMinutes = hours * 60 + minutes;
  return match[1] === '-' ? -totalMinutes : totalMinutes;
}

function formatDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatCapturedAtLocal(capturedAt: string, capturedAtOffset: string | null) {
  const offsetMinutes = parseUtcOffsetMinutes(capturedAtOffset);
  if (offsetMinutes === null) {
    return '';
  }

  const parsed = new Date(capturedAt);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const localWallClock = new Date(parsed.getTime() + offsetMinutes * 60 * 1000);
  return [
    localWallClock.getUTCFullYear(),
    '-',
    formatDatePart(localWallClock.getUTCMonth() + 1),
    '-',
    formatDatePart(localWallClock.getUTCDate()),
    'T',
    formatDatePart(localWallClock.getUTCHours()),
    ':',
    formatDatePart(localWallClock.getUTCMinutes()),
    ':',
    formatDatePart(localWallClock.getUTCSeconds()),
  ].join('');
}

export function flattenExportRows(
  rolls: Roll[],
  exposureMap: Map<string, Exposure[]>,
  gearByName: Map<string, GearRegistryItem> = new Map(),
  stopStep: ExposureStopStep = '1/3',
  cameras: GearRegistryItem[] = [],
) {
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
        ev100: '',
        lens: '',
        lensFocalLength: '',
        flash: '',
        flashPower: '',
        ndStops: '',
        latitude: '',
        longitude: '',
        locationAccuracy: '',
        capturedAt: '',
        capturedAtLocal: '',
        capturedAtOffset: '',
        exposureNotes: '',
      });
      continue;
    }

    for (const exposure of exposures) {
      const effectiveLens = resolveEffectiveExposureLens(cameras, roll.camera, exposure.lens);
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
        ev100: formatExportEv100(
          exposure.fStop,
          exposure.shutterSpeed,
          roll.shotIso,
          stopStep,
        ),
        lens: stringifyNullable(effectiveLens),
        lensFocalLength: getLensFocalLength(effectiveLens, gearByName),
        flash: stringifyNullable(exposure.flash),
        flashPower: stringifyNullable(exposure.flashPower),
        ndStops: stringifyNullable(exposure.ndStops),
        latitude: stringifyNullable(exposure.latitude),
        longitude: stringifyNullable(exposure.longitude),
        locationAccuracy: stringifyNullable(exposure.locationAccuracy),
        capturedAt: exposure.capturedAt,
        capturedAtLocal: formatCapturedAtLocal(exposure.capturedAt, exposure.capturedAtOffset),
        capturedAtOffset: stringifyNullable(exposure.capturedAtOffset),
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

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { nowIsoString } from '@/lib/time';
import type { Exposure, GearRegistryItem, Roll } from '@/types/domain';
import type { AppSettings } from '@/types/settings';

const DATABASE_BACKUP_VERSION = 1;

export type DatabaseBackup = {
  version: number;
  exportedAt: string;
  rolls: Roll[];
  exposures: Exposure[];
  gear: GearRegistryItem[];
  settings: AppSettings;
};

function createTimestampSuffix() {
  return nowIsoString().replaceAll(':', '-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertBackupShape(value: unknown): asserts value is DatabaseBackup {
  if (!isRecord(value)) {
    throw new Error('Backup file is not a valid object.');
  }

  if (value.version !== DATABASE_BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(value.version)}`);
  }

  if (!Array.isArray(value.rolls) || !Array.isArray(value.exposures) || !Array.isArray(value.gear)) {
    throw new Error('Backup file is missing required collections.');
  }

  if (!isRecord(value.settings)) {
    throw new Error('Backup file is missing settings.');
  }
}

export function parseDatabaseBackup(contents: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  assertBackupShape(parsed);
  return parsed;
}

async function shareBackupFile(fileName: string, contents: string) {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Export full database backup',
    mimeType: 'application/json',
    UTI: 'public.json',
  });

  return file.uri;
}

export async function buildDatabaseBackup(): Promise<DatabaseBackup> {
  const [{ exposureRepository }, { gearRepository }, { rollRepository }, { appSettingsRepository }] =
    await Promise.all([
      import('@/db/repositories/sqlite-exposure-repository'),
      import('@/db/repositories/sqlite-gear-repository'),
      import('@/db/repositories/sqlite-roll-repository'),
      import('@/db/repositories/sqlite-app-settings-repository'),
    ]);
  const rolls = await rollRepository.list();
  const exposuresByRoll = await Promise.all(
    rolls.map((roll) => exposureRepository.listByRollId(roll.id)),
  );
  const exposures = exposuresByRoll.flat();
  const gear = (
    await Promise.all([
      gearRepository.listByType('camera'),
      gearRepository.listByType('lens'),
      gearRepository.listByType('film'),
    ])
  ).flat();
  const settings = await appSettingsRepository.getSettings();

  return {
    version: DATABASE_BACKUP_VERSION,
    exportedAt: nowIsoString(),
    rolls,
    exposures,
    gear,
    settings,
  };
}

export async function exportDatabaseBackup() {
  const backup = await buildDatabaseBackup();
  const contents = JSON.stringify(backup, null, 2);
  const fileUri = await shareBackupFile(
    `exposure-logger-backup-${createTimestampSuffix()}.json`,
    contents,
  );

  return {
    fileUri,
    rollCount: backup.rolls.length,
    exposureCount: backup.exposures.length,
    gearCount: backup.gear.length,
  };
}

export async function pickDatabaseBackupFile() {
  const file = await File.pickFileAsync(undefined, 'application/json');

  if (Array.isArray(file)) {
    return file[0] ?? null;
  }

  return file;
}

export async function importDatabaseBackup(backup: DatabaseBackup) {
  const [
    { db },
    { toExposureInsert, toGearRegistryInsert, toRollInsert },
    { appSettingsTable, exposuresTable, gearRegistryTable, rollsTable },
  ] = await Promise.all([
    import('@/db/client'),
    import('@/db/mappers'),
    import('@/db/schema'),
  ]);
  const rollIds = new Set(backup.rolls.map((roll) => roll.id));
  const invalidExposure = backup.exposures.find((exposure) => !rollIds.has(exposure.rollId));
  if (invalidExposure) {
    throw new Error(`Backup references a missing roll for exposure ${invalidExposure.id}.`);
  }

  await db.transaction(async (tx) => {
    await tx.delete(exposuresTable);
    await tx.delete(rollsTable);
    await tx.delete(gearRegistryTable);
    await tx.delete(appSettingsTable);

    if (backup.rolls.length > 0) {
      await tx.insert(rollsTable).values(backup.rolls.map((roll) => toRollInsert(roll)));
    }

    if (backup.exposures.length > 0) {
      await tx.insert(exposuresTable).values(
        backup.exposures.map((exposure) => toExposureInsert(exposure)),
      );
    }

    if (backup.gear.length > 0) {
      await tx.insert(gearRegistryTable).values(
        backup.gear.map((item) => toGearRegistryInsert(item)),
      );
    }

    await tx.insert(appSettingsTable).values(
      Object.entries(backup.settings).map(([key, value]) => ({
        key,
        value: String(value),
      })),
    );
  });

  return {
    rollCount: backup.rolls.length,
    exposureCount: backup.exposures.length,
    gearCount: backup.gear.length,
  };
}

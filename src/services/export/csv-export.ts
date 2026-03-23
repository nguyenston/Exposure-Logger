import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { exposureRepository } from '@/db/repositories/sqlite-exposure-repository';
import { rollRepository } from '@/db/repositories/sqlite-roll-repository';
import { nowIsoString } from '@/lib/time';
import type { Exposure, Roll } from '@/types/domain';
import type { AppSettings } from '@/types/settings';

import { buildExportCsv, flattenExportRows, selectLibraryExportRolls } from './csv-format';

async function shareCsvFile(fileName: string, contents: string) {
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('File export directory is unavailable.');
  }

  const fileUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, contents);

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    dialogTitle: 'Export exposure log CSV',
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });

  return fileUri;
}

function buildExposureMap(entries: { roll: Roll; exposures: Exposure[] }[]) {
  return new Map(entries.map((entry) => [entry.roll.id, entry.exposures]));
}

async function loadExposureEntries(rolls: Roll[]) {
  const entries = await Promise.all(
    rolls.map(async (roll) => ({
      roll,
      exposures: await exposureRepository.listByRollId(roll.id),
    })),
  );

  return entries;
}

function createTimestampSuffix() {
  return nowIsoString().replaceAll(':', '-');
}

export async function exportRollCsv(roll: Roll) {
  const exposures = await exposureRepository.listByRollId(roll.id);
  const rows = flattenExportRows([roll], new Map([[roll.id, exposures]]));
  const contents = buildExportCsv(rows);
  const fileName = `roll-${roll.id}-${createTimestampSuffix()}.csv`;
  const fileUri = await shareCsvFile(fileName, contents);

  return {
    fileUri,
    exportedRollIds: [roll.id],
    exportedRows: rows.length,
  };
}

export async function exportLibraryCsv(settings: AppSettings) {
  const allRolls = await rollRepository.list();
  const exportRolls = selectLibraryExportRolls(allRolls, settings.libraryExportScope);

  if (exportRolls.length === 0) {
    throw new Error('No rolls match the current whole-library export settings.');
  }

  const entries = await loadExposureEntries(exportRolls);
  const rows = flattenExportRows(
    exportRolls,
    buildExposureMap(entries),
  );
  const contents = buildExportCsv(rows);
  const fileName = `library-export-${createTimestampSuffix()}.csv`;
  const fileUri = await shareCsvFile(fileName, contents);

  const autoArchivedRollIds: string[] = [];
  if (settings.autoArchiveAfterLibraryExport) {
    const finishedRolls = exportRolls.filter((roll) => roll.status === 'finished');
    for (const roll of finishedRolls) {
      await rollRepository.update(roll.id, {
        status: 'archived',
      });
      autoArchivedRollIds.push(roll.id);
    }
  }

  return {
    fileUri,
    exportedRollIds: exportRolls.map((roll) => roll.id),
    autoArchivedRollIds,
    exportedRows: rows.length,
  };
}

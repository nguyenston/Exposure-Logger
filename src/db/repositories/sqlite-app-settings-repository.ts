import { db } from '@/db/client';
import type { AppSettingsRepository } from '@/db/repositories/app-settings-repository';
import { appSettingsTable } from '@/db/schema';
import {
  defaultAppSettings,
  type AppSettings,
  type LibraryExportScope,
  type ExposureStopStep,
  type VoiceTranscriptApplyMode,
} from '@/types/settings';

type SettingKey = keyof AppSettings;

const EXPOSURE_DEFAULT_KEYS: SettingKey[] = [
  'defaultFStopFromPrevious',
  'defaultShutterSpeedFromPrevious',
  'defaultLensFromPrevious',
  'defaultTimestampToNow',
  'defaultLocationEnabled',
  'defaultLocationToCurrent',
  'exposureStopStep',
  'voiceTranscriptApplyMode',
  'libraryExportScope',
  'autoArchiveAfterLibraryExport',
];

function parseStopStepSetting(value: string | undefined): ExposureStopStep {
  if (value === '1' || value === '1/2' || value === '1/3') {
    return value;
  }

  return defaultAppSettings.exposureStopStep;
}

function parseLibraryExportScopeSetting(value: string | undefined): LibraryExportScope {
  if (value === 'finished_only' || value === 'finished_and_archived') {
    return value;
  }

  return defaultAppSettings.libraryExportScope;
}

function parseVoiceTranscriptApplyModeSetting(value: string | undefined): VoiceTranscriptApplyMode {
  if (value === 'auto_apply' || value === 'review_before_apply') {
    return value;
  }

  return defaultAppSettings.voiceTranscriptApplyMode;
}

function parseBooleanSetting(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

export class SQLiteAppSettingsRepository implements AppSettingsRepository {
  constructor(private readonly database = db) {}

  async getSettings() {
    const rows = await this.database.select().from(appSettingsTable);
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return {
      defaultFStopFromPrevious: parseBooleanSetting(
        map.get('defaultFStopFromPrevious'),
        defaultAppSettings.defaultFStopFromPrevious,
      ),
      defaultShutterSpeedFromPrevious: parseBooleanSetting(
        map.get('defaultShutterSpeedFromPrevious'),
        defaultAppSettings.defaultShutterSpeedFromPrevious,
      ),
      defaultLensFromPrevious: parseBooleanSetting(
        map.get('defaultLensFromPrevious'),
        defaultAppSettings.defaultLensFromPrevious,
      ),
      defaultTimestampToNow: parseBooleanSetting(
        map.get('defaultTimestampToNow'),
        defaultAppSettings.defaultTimestampToNow,
      ),
      defaultLocationEnabled: parseBooleanSetting(
        map.get('defaultLocationEnabled'),
        defaultAppSettings.defaultLocationEnabled,
      ),
      defaultLocationToCurrent: parseBooleanSetting(
        map.get('defaultLocationToCurrent'),
        defaultAppSettings.defaultLocationToCurrent,
      ),
      exposureStopStep: parseStopStepSetting(map.get('exposureStopStep')),
      voiceTranscriptApplyMode: parseVoiceTranscriptApplyModeSetting(
        map.get('voiceTranscriptApplyMode'),
      ),
      libraryExportScope: parseLibraryExportScopeSetting(map.get('libraryExportScope')),
      autoArchiveAfterLibraryExport: parseBooleanSetting(
        map.get('autoArchiveAfterLibraryExport'),
        defaultAppSettings.autoArchiveAfterLibraryExport,
      ),
    };
  }

  async updateSettings(settings: Partial<AppSettings>) {
    const nextSettings = {
      ...(await this.getSettings()),
      ...settings,
    };

    await this.database.transaction(async (tx) => {
      for (const key of EXPOSURE_DEFAULT_KEYS) {
        await tx
          .insert(appSettingsTable)
          .values({
            key,
            value: String(nextSettings[key]),
          })
          .onConflictDoUpdate({
            target: appSettingsTable.key,
            set: {
              value: String(nextSettings[key]),
            },
          });
      }
    });

    return nextSettings;
  }
}

export const appSettingsRepository = new SQLiteAppSettingsRepository();

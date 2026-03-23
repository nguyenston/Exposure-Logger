import { db } from '@/db/client';
import type { AppSettingsRepository } from '@/db/repositories/app-settings-repository';
import { appSettingsTable } from '@/db/schema';
import {
  defaultExposureDefaultsSettings,
  type ExposureStopStep,
  type ExposureDefaultsSettings,
} from '@/types/settings';

type SettingKey = keyof ExposureDefaultsSettings;

const EXPOSURE_DEFAULT_KEYS: SettingKey[] = [
  'defaultFStopFromPrevious',
  'defaultShutterSpeedFromPrevious',
  'defaultLensFromPrevious',
  'defaultTimestampToNow',
  'defaultLocationEnabled',
  'defaultLocationToCurrent',
  'exposureStopStep',
];

function parseStopStepSetting(value: string | undefined): ExposureStopStep {
  if (value === '1' || value === '1/2' || value === '1/3') {
    return value;
  }

  return defaultExposureDefaultsSettings.exposureStopStep;
}

function parseBooleanSetting(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

export class SQLiteAppSettingsRepository implements AppSettingsRepository {
  constructor(private readonly database = db) {}

  async getExposureDefaults() {
    const rows = await this.database.select().from(appSettingsTable);
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return {
      defaultFStopFromPrevious: parseBooleanSetting(
        map.get('defaultFStopFromPrevious'),
        defaultExposureDefaultsSettings.defaultFStopFromPrevious,
      ),
      defaultShutterSpeedFromPrevious: parseBooleanSetting(
        map.get('defaultShutterSpeedFromPrevious'),
        defaultExposureDefaultsSettings.defaultShutterSpeedFromPrevious,
      ),
      defaultLensFromPrevious: parseBooleanSetting(
        map.get('defaultLensFromPrevious'),
        defaultExposureDefaultsSettings.defaultLensFromPrevious,
      ),
      defaultTimestampToNow: parseBooleanSetting(
        map.get('defaultTimestampToNow'),
        defaultExposureDefaultsSettings.defaultTimestampToNow,
      ),
      defaultLocationEnabled: parseBooleanSetting(
        map.get('defaultLocationEnabled'),
        defaultExposureDefaultsSettings.defaultLocationEnabled,
      ),
      defaultLocationToCurrent: parseBooleanSetting(
        map.get('defaultLocationToCurrent'),
        defaultExposureDefaultsSettings.defaultLocationToCurrent,
      ),
      exposureStopStep: parseStopStepSetting(map.get('exposureStopStep')),
    };
  }

  async updateExposureDefaults(settings: Partial<ExposureDefaultsSettings>) {
    const nextSettings = {
      ...(await this.getExposureDefaults()),
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

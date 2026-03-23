import type { ExposureDefaultsSettings } from '@/types/settings';

export interface AppSettingsRepository {
  getExposureDefaults(): Promise<ExposureDefaultsSettings>;
  updateExposureDefaults(settings: Partial<ExposureDefaultsSettings>): Promise<ExposureDefaultsSettings>;
}

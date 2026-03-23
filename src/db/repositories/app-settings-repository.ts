import type { AppSettings } from '@/types/settings';

export interface AppSettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
}

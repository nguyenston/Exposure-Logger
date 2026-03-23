import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import {
  defaultAppSettings,
  type AppSettings,
} from '@/types/settings';

type AppSettingsRepositoryModule = typeof import('@/db/repositories/sqlite-app-settings-repository');

async function loadAppSettingsModule(): Promise<AppSettingsRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-app-settings-repository');
}

export function useExposureDefaultsSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const module = await loadAppSettingsModule();
      if (!module) {
        setSettings(defaultAppSettings);
        return;
      }

      const nextSettings = await module.appSettingsRepository.getSettings();
      setSettings(nextSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const updateSettings = useCallback(async (next: Partial<AppSettings>) => {
    setError(null);

    try {
      const module = await loadAppSettingsModule();
      if (!module) {
        throw new Error('Settings are not available on web.');
      }

      const updated = await module.appSettingsRepository.updateSettings(next);
      setSettings(updated);
      return updated;
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to update settings.';
      setError(nextError);
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    reload,
    updateSettings,
  };
}

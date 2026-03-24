import { useCallback, useEffect, useRef, useState } from 'react';
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

let cachedSettings: AppSettings = defaultAppSettings;

export function useExposureDefaultsSettings() {
  const [settings, setSettings] = useState<AppSettings>(cachedSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestVersionRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const reload = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setError(null);

    try {
      const module = await loadAppSettingsModule();
      if (!module) {
        if (requestVersion === requestVersionRef.current) {
          cachedSettings = defaultAppSettings;
          setSettings(defaultAppSettings);
        }
        return;
      }

      const nextSettings = await module.appSettingsRepository.getSettings();
      if (requestVersion === requestVersionRef.current) {
        cachedSettings = nextSettings;
        setSettings(nextSettings);
      }
    } catch (err) {
      if (requestVersion === requestVersionRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
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
    const requestVersion = ++requestVersionRef.current;
    const previousSettings = settingsRef.current;
    const optimisticSettings = {
      ...previousSettings,
      ...next,
    };
    setError(null);
    cachedSettings = optimisticSettings;
    setSettings(optimisticSettings);

    try {
      const module = await loadAppSettingsModule();
      if (!module) {
        throw new Error('Settings are not available on web.');
      }

      const updated = await module.appSettingsRepository.updateSettings(next);
      if (requestVersion === requestVersionRef.current) {
        cachedSettings = updated;
        setSettings(updated);
      }
      return updated;
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to update settings.';
      if (requestVersion === requestVersionRef.current) {
        setError(nextError);
        cachedSettings = previousSettings;
        setSettings(previousSettings);
      }
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

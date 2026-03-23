import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import type { CreateExposureInput } from '@/db/repositories/exposure-repository';
import type { Exposure } from '@/types/domain';

type ExposureRepositoryModule = typeof import('@/db/repositories/sqlite-exposure-repository');

async function loadExposureModule(): Promise<ExposureRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-exposure-repository');
}

export function useExposures(rollId: string | null | undefined) {
  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedRollId = rollId ?? null;

  const reload = useCallback(async () => {
    if (!resolvedRollId) {
      setExposures([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await loadExposureModule();
      if (!module) {
        setExposures([]);
        return;
      }

      const nextExposures = await module.exposureRepository.listByRollId(resolvedRollId);
      setExposures(nextExposures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exposures.');
    } finally {
      setLoading(false);
    }
  }, [resolvedRollId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const createExposure = useCallback(
    async (input: CreateExposureInput) => {
      const module = await loadExposureModule();
      if (!module) {
        throw new Error('Exposure storage is not available on web.');
      }

      const created = await module.exposureRepository.create(input);
      await reload();
      return created;
    },
    [reload],
  );

  const updateExposure = useCallback(
    async (id: string, input: Partial<CreateExposureInput>) => {
      const module = await loadExposureModule();
      if (!module) {
        throw new Error('Exposure storage is not available on web.');
      }

      const updated = await module.exposureRepository.update(id, input);
      await reload();
      return updated;
    },
    [reload],
  );

  const deleteExposure = useCallback(
    async (id: string) => {
      const module = await loadExposureModule();
      if (!module) {
        throw new Error('Exposure storage is not available on web.');
      }

      await module.exposureRepository.delete(id);
      await reload();
    },
    [reload],
  );

  const latestExposure = useMemo(
    () => (exposures.length > 0 ? exposures[exposures.length - 1] : null),
    [exposures],
  );

  return {
    exposures,
    latestExposure,
    loading,
    error,
    reload,
    createExposure,
    updateExposure,
    deleteExposure,
  };
}

export function useExposure(exposureId: string | null | undefined) {
  const [exposure, setExposure] = useState<Exposure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedExposureId = exposureId ?? null;

  const reload = useCallback(async () => {
    if (!resolvedExposureId) {
      setExposure(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await loadExposureModule();
      if (!module) {
        setExposure(null);
        return;
      }

      const nextExposure = await module.exposureRepository.getById(resolvedExposureId);
      setExposure(nextExposure);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exposure.');
    } finally {
      setLoading(false);
    }
  }, [resolvedExposureId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return {
    exposure,
    loading,
    error,
    reload,
  };
}

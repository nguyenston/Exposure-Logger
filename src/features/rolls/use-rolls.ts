import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import { groupRollsByStatus } from '@/features/rolls/roll-utils';
import { nowIsoString } from '@/lib/time';
import type { CreateRollInput } from '@/db/repositories/roll-repository';
import type { Roll } from '@/types/domain';

type RollRepositoryModule = typeof import('@/db/repositories/sqlite-roll-repository');

async function loadRollModule(): Promise<RollRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-roll-repository');
}

export function useRolls() {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const module = await loadRollModule();
      if (!module) {
        setRolls([]);
        return;
      }

      const nextRolls = await module.rollRepository.list();
      setRolls(nextRolls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rolls.');
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

  const createRoll = useCallback(async (input: Omit<CreateRollInput, 'startedAt'> & { startedAt?: string | null }) => {
    const module = await loadRollModule();
    if (!module) {
      throw new Error('Roll storage is not available on web.');
    }

    const created = await module.rollRepository.create({
      ...input,
      startedAt: input.startedAt ?? nowIsoString(),
    });
    await reload();
    return created;
  }, [reload]);

  const updateRoll = useCallback(async (id: string, input: Partial<CreateRollInput>) => {
    const module = await loadRollModule();
    if (!module) {
      throw new Error('Roll storage is not available on web.');
    }

    const updated = await module.rollRepository.update(id, input);
    await reload();
    return updated;
  }, [reload]);

  const deleteRoll = useCallback(async (id: string) => {
    const module = await loadRollModule();
    if (!module) {
      throw new Error('Roll storage is not available on web.');
    }

    await module.rollRepository.delete(id);
    await reload();
  }, [reload]);

  const groupedRolls = useMemo(() => groupRollsByStatus(rolls), [rolls]);

  return {
    rolls,
    groupedRolls,
    loading,
    error,
    reload,
    createRoll,
    updateRoll,
    deleteRoll,
  };
}

export function useRoll(rollId: string | string[] | undefined) {
  const [roll, setRoll] = useState<Roll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedRollId = typeof rollId === 'string' ? rollId : undefined;

  const reload = useCallback(async () => {
    if (!resolvedRollId) {
      setRoll(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const module = await loadRollModule();
      if (!module) {
        setRoll(null);
        return;
      }

      const nextRoll = await module.rollRepository.getById(resolvedRollId);
      setRoll(nextRoll);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roll.');
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

  return {
    roll,
    loading,
    error,
    reload,
  };
}

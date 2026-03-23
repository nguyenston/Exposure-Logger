import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import { sortGearOptions } from '@/features/gear/gear-utils';
import { useRecentGearStore } from '@/store/recent-gear-store';
import type { GearRegistryItem, GearType } from '@/types/domain';

type GearRepositoryModule = typeof import('@/db/repositories/sqlite-gear-repository');

async function loadGearModule(): Promise<GearRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-gear-repository');
}

export function useGearRegistry(type: GearType, query = '') {
  const [items, setItems] = useState<GearRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recentIds = useRecentGearStore((state) => state.recentIdsByType[type]);
  const markRecent = useRecentGearStore((state) => state.markRecent);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const module = await loadGearModule();
      if (!module) {
        setItems([]);
        return;
      }

      const nextItems = await module.gearRepository.listByType(type);
      setItems(nextItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gear items.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const createItem = useCallback(
    async (name: string) => {
      setError(null);

      try {
        const trimmedName = name.trim();
        if (!trimmedName) {
          throw new Error('Gear name is required.');
        }

        const module = await loadGearModule();
        if (!module) {
          throw new Error('Gear registry is not available on web.');
        }

        const existing = await module.gearRepository.findByTypeAndName(type, trimmedName);
        const item =
          existing ??
          (await module.gearRepository.create({
            type,
            name: trimmedName,
            notes: null,
          }));

        markRecent(type, item.id);
        await reload();
        return item;
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Failed to create gear item.';
        setError(nextError);
        throw err;
      }
    },
    [markRecent, reload, type],
  );

  const updateItem = useCallback(
    async (id: string, name: string) => {
      setError(null);

      try {
        const trimmedName = name.trim();
        if (!trimmedName) {
          throw new Error('Gear name is required.');
        }

        const module = await loadGearModule();
        if (!module) {
          throw new Error('Gear registry is not available on web.');
        }

        const item = await module.gearRepository.update(id, { name: trimmedName });
        await reload();
        return item;
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Failed to update gear item.';
        setError(nextError);
        throw err;
      }
    },
    [reload],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setError(null);

      try {
        const module = await loadGearModule();
        if (!module) {
          throw new Error('Gear registry is not available on web.');
        }

        await module.gearRepository.delete(id);
        await reload();
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Failed to delete gear item.';
        setError(nextError);
        throw err;
      }
    },
    [reload],
  );

  const rememberItem = useCallback(
    (item: GearRegistryItem) => {
      markRecent(type, item.id);
    },
    [markRecent, type],
  );

  const visibleItems = useMemo(() => sortGearOptions(items, recentIds, query), [items, query, recentIds]);

  return {
    items,
    visibleItems,
    loading,
    error,
    recentIds,
    reload,
    createItem,
    updateItem,
    deleteItem,
    rememberItem,
  };
}

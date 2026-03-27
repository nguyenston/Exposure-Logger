import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import { sortGearOptions } from '@/features/gear/gear-utils';
import { parseFilmMetadata } from '@/features/gear/film-metadata';
import { parseLensMetadata } from '@/features/gear/lens-metadata';
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
    async (
      input:
        | string
        | Pick<
            GearRegistryItem,
            'name' | 'nativeIso' | 'focalLength' | 'maxAperture' | 'mount' | 'serialOrNickname' | 'notes'
          >,
    ) => {
      setError(null);

      try {
        const baseInput =
          typeof input === 'string'
            ? {
                name: input,
                nativeIso: null,
                focalLength: null,
                maxAperture: null,
                mount: null,
                serialOrNickname: null,
                notes: null,
              }
            : input;
        const trimmedName = baseInput.name.trim();
        if (!trimmedName) {
          throw new Error('Gear name is required.');
        }

        const module = await loadGearModule();
        if (!module) {
          throw new Error('Gear registry is not available on web.');
        }

        const existing = await module.gearRepository.findByTypeAndName(type, trimmedName);
        const parsedLensMetadata = type === 'lens' ? parseLensMetadata(trimmedName) : null;
        const parsedFilmMetadata = type === 'film' ? parseFilmMetadata(trimmedName) : null;
        const item =
          existing ??
          (await module.gearRepository.create({
            type,
            name: trimmedName,
            nativeIso: baseInput.nativeIso ?? parsedFilmMetadata?.nativeIso ?? null,
            focalLength: baseInput.focalLength ?? parsedLensMetadata?.focalLength ?? null,
            maxAperture: baseInput.maxAperture ?? parsedLensMetadata?.maxAperture ?? null,
            mount: baseInput.mount ?? null,
            serialOrNickname: baseInput.serialOrNickname ?? null,
            notes: baseInput.notes ?? null,
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
    async (
      id: string,
      input:
        | string
        | Partial<
            Pick<
              GearRegistryItem,
              'name' | 'nativeIso' | 'focalLength' | 'maxAperture' | 'mount' | 'serialOrNickname' | 'notes'
            >
          >,
    ) => {
      setError(null);

      try {
        const trimmedName = typeof input === 'string' ? input.trim() : input.name?.trim();
        if (typeof input === 'string' && !trimmedName) {
          throw new Error('Gear name is required.');
        }

        const module = await loadGearModule();
        if (!module) {
          throw new Error('Gear registry is not available on web.');
        }

        const item = await module.gearRepository.update(id, {
          ...(typeof input === 'string' ? { name: trimmedName } : input),
          ...(trimmedName ? { name: trimmedName } : {}),
        });
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

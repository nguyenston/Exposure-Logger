import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';

import { parseCameraMetadata } from '@/features/gear/camera-metadata';
import { sortGearOptions } from '@/features/gear/gear-utils';
import { parseFilmMetadata } from '@/features/gear/film-metadata';
import { parseLensMetadata } from '@/features/gear/lens-metadata';
import { useRecentGearStore } from '@/store/recent-gear-store';
import type { GearRegistryItem, GearType } from '@/types/domain';

type EditableGearFields = Partial<
  Pick<
    GearRegistryItem,
    'name' | 'nickname' | 'nativeIso' | 'focalLength' | 'maxAperture' | 'mount' | 'serialOrNickname' | 'notes'
  >
> &
  Pick<GearRegistryItem, 'name'>;

type GearRepositoryModule = typeof import('@/db/repositories/sqlite-gear-repository');

async function loadGearModule(): Promise<GearRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-gear-repository');
}

function normalizeOptionalNickname(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : '';
}

function hasDuplicateCameraIdentity(
  items: GearRegistryItem[],
  name: string,
  nickname: string | null | undefined,
  excludeId?: string,
) {
  const normalizedName = name.trim().toLowerCase();
  const normalizedNickname = normalizeOptionalNickname(nickname);

  return items.some((item) => {
    if (item.type !== 'camera' || item.id === excludeId) {
      return false;
    }

    return (
      item.name.trim().toLowerCase() === normalizedName &&
      normalizeOptionalNickname(item.nickname) === normalizedNickname
    );
  });
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
      input: string | EditableGearFields,
    ) => {
      setError(null);

      try {
        const baseInput =
          typeof input === 'string'
            ? {
                name: input,
                nickname: null,
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

        const parsedCameraMetadata = type === 'camera' ? parseCameraMetadata(trimmedName) : null;
        const parsedLensMetadata = type === 'lens' ? parseLensMetadata(trimmedName) : null;
        const parsedFilmMetadata = type === 'film' ? parseFilmMetadata(trimmedName) : null;
        const resolvedName = parsedCameraMetadata?.name ?? trimmedName;
        const resolvedNickname = parsedCameraMetadata?.nickname ?? baseInput.nickname ?? null;
        const existing =
          type === 'camera'
            ? null
            : await module.gearRepository.findByTypeAndName(type, trimmedName);

        if (
          type === 'camera' &&
          hasDuplicateCameraIdentity(items, resolvedName, resolvedNickname)
        ) {
          throw new Error('A camera with the same name and nickname already exists.');
        }
        const item =
          existing ??
          (await module.gearRepository.create({
            type,
            name: resolvedName,
            nickname: type === 'camera' ? resolvedNickname : baseInput.nickname ?? null,
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
    [items, markRecent, reload, type],
  );

  const updateItem = useCallback(
    async (
      id: string,
      input:
        | string
        | Partial<
            Pick<
              GearRegistryItem,
              'name' | 'nickname' | 'nativeIso' | 'focalLength' | 'maxAperture' | 'mount' | 'serialOrNickname' | 'notes'
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

        const existingItem = items.find((item) => item.id === id) ?? null;
        const parsedCameraMetadata =
          type === 'camera' && trimmedName ? parseCameraMetadata(trimmedName) : null;
        const resolvedName =
          parsedCameraMetadata?.name ??
          (trimmedName || existingItem?.name || '');
        const resolvedNickname =
          type === 'camera'
            ? (parsedCameraMetadata?.nickname ??
              (typeof input === 'string' ? existingItem?.nickname ?? null : input.nickname ?? existingItem?.nickname ?? null))
            : undefined;

        if (
          type === 'camera' &&
          existingItem &&
          hasDuplicateCameraIdentity(items, resolvedName, resolvedNickname, id)
        ) {
          throw new Error('A camera with the same name and nickname already exists.');
        }

        const item = await module.gearRepository.update(id, {
          ...(typeof input === 'string' ? { name: resolvedName, nickname: resolvedNickname } : input),
          ...(trimmedName ? { name: resolvedName } : {}),
          ...(type === 'camera' ? { nickname: resolvedNickname } : {}),
        });
        await reload();
        return item;
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Failed to update gear item.';
        setError(nextError);
        throw err;
      }
    },
    [items, reload, type],
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

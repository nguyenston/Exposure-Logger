import { Platform } from 'react-native';
import * as Location from 'expo-location';

type ExposureRepositoryModule = typeof import('@/db/repositories/sqlite-exposure-repository');

async function loadExposureModule(): Promise<ExposureRepositoryModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('@/db/repositories/sqlite-exposure-repository');
}

const activeRefinements = new Map<string, symbol>();

export async function refineExposureLocation(exposureId: string) {
  if (Platform.OS === 'web') {
    return;
  }

  const token = Symbol(exposureId);
  activeRefinements.set(exposureId, token);

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (activeRefinements.get(exposureId) !== token) {
      return;
    }

    const module = await loadExposureModule();
    if (!module) {
      return;
    }

    const exposure = await module.exposureRepository.getById(exposureId);
    if (!exposure) {
      return;
    }

    const nextAccuracy = location.coords.accuracy ?? null;
    const shouldUpdate =
      exposure.latitude === null ||
      exposure.longitude === null ||
      exposure.locationAccuracy === null ||
      nextAccuracy === null ||
      nextAccuracy < exposure.locationAccuracy;

    if (!shouldUpdate) {
      return;
    }

    await module.exposureRepository.update(exposureId, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      locationAccuracy: nextAccuracy,
    });
  } finally {
    if (activeRefinements.get(exposureId) === token) {
      activeRefinements.delete(exposureId);
    }
  }
}

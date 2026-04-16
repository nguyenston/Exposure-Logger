import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { useCurrentLocationStore } from '@/store/current-location-store';

const MILLISECONDS_PER_MINUTE = 60 * 1000;

function formatLocationResult(
  coords: Pick<Location.LocationObjectCoords, 'latitude' | 'longitude' | 'accuracy'>,
  source: 'quick' | 'refined',
  needsRefinement: boolean,
) {
  return {
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    locationAccuracy: coords.accuracy !== null ? String(coords.accuracy) : '',
    source,
    needsRefinement,
  } as const;
}

function getLocationAgeMs(location: Location.LocationObject) {
  return Date.now() - location.timestamp;
}

export function useCurrentLocation() {
  const latestLocation = useCurrentLocationStore((state) => state.latestLocation);
  const loading = useCurrentLocationStore((state) => state.loading);
  const error = useCurrentLocationStore((state) => state.error);
  const version = useCurrentLocationStore((state) => state.version);
  const setLoading = useCurrentLocationStore((state) => state.setLoading);
  const setError = useCurrentLocationStore((state) => state.setError);
  const setLatestLocation = useCurrentLocationStore((state) => state.setLatestLocation);

  const requestCurrentLocation = useCallback(async (staleAfterMinutes = 3) => {
    if (Platform.OS === 'web') {
      throw new Error('Current GPS capture is not available on web.');
    }

    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Location permission was denied.');
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      const staleAfterMs = Math.max(1, staleAfterMinutes) * MILLISECONDS_PER_MINUTE;
      let shouldRefine = false;

      if (lastKnown) {
        shouldRefine = getLocationAgeMs(lastKnown) > staleAfterMs;
        setLatestLocation(formatLocationResult(lastKnown.coords, 'quick', shouldRefine));
      } else {
        const quickLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        shouldRefine = true;
        setLatestLocation(formatLocationResult(quickLocation.coords, 'quick', shouldRefine));
      }

      if (!shouldRefine) {
        return lastKnown;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatestLocation(formatLocationResult(location.coords, 'refined', false));
      return location;
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Failed to fetch current location.';
      setError(nextError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setError, setLatestLocation, setLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    latestLocation,
    loading,
    error,
    version,
    clearError,
    requestCurrentLocation,
  };
}

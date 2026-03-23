import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { useCurrentLocationStore } from '@/store/current-location-store';

function formatLocationResult(
  coords: Pick<Location.LocationObjectCoords, 'latitude' | 'longitude' | 'accuracy'>,
  source: 'last_known' | 'current',
) {
  return {
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    locationAccuracy: coords.accuracy !== null ? String(coords.accuracy) : '',
    source,
  } as const;
}

export function useCurrentLocation() {
  const latestLocation = useCurrentLocationStore((state) => state.latestLocation);
  const loading = useCurrentLocationStore((state) => state.loading);
  const error = useCurrentLocationStore((state) => state.error);
  const version = useCurrentLocationStore((state) => state.version);
  const setLoading = useCurrentLocationStore((state) => state.setLoading);
  const setError = useCurrentLocationStore((state) => state.setError);
  const setLatestLocation = useCurrentLocationStore((state) => state.setLatestLocation);

  const requestCurrentLocation = useCallback(async () => {
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

      const lastKnown = await Location.getLastKnownPositionAsync({
        requiredAccuracy: 500,
        maxAge: 1000 * 60 * 10,
      });

      if (lastKnown) {
        setLatestLocation(formatLocationResult(lastKnown.coords, 'last_known'));
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatestLocation(formatLocationResult(location.coords, 'current'));
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

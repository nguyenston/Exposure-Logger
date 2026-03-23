import { create } from 'zustand';

export type CurrentLocationSnapshot = {
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  source: 'last_known' | 'current';
};

type CurrentLocationState = {
  latestLocation: CurrentLocationSnapshot | null;
  loading: boolean;
  error: string | null;
  version: number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLatestLocation: (location: CurrentLocationSnapshot) => void;
};

export const useCurrentLocationStore = create<CurrentLocationState>((set) => ({
  latestLocation: null,
  loading: false,
  error: null,
  version: 0,
  setLoading: (loading) => set(() => ({ loading })),
  setError: (error) => set(() => ({ error })),
  setLatestLocation: (latestLocation) =>
    set((state) => ({
      latestLocation,
      error: null,
      version: state.version + 1,
    })),
}));

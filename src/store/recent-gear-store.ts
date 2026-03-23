import { create } from 'zustand';

import type { GearType } from '@/types/domain';

type RecentGearState = {
  recentIdsByType: Record<GearType, string[]>;
  markRecent: (type: GearType, id: string) => void;
};

const MAX_RECENT = 5;

export const useRecentGearStore = create<RecentGearState>((set) => ({
  recentIdsByType: {
    camera: [],
    lens: [],
    film: [],
  },
  markRecent: (type, id) =>
    set((state) => {
      const next = [id, ...state.recentIdsByType[type].filter((existing) => existing !== id)].slice(
        0,
        MAX_RECENT,
      );

      return {
        recentIdsByType: {
          ...state.recentIdsByType,
          [type]: next,
        },
      };
    }),
}));

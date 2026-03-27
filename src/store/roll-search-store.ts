import { create } from 'zustand';

import {
  EMPTY_ROLL_SEARCH_CRITERIA,
  type RollSearchCriteria,
} from '@/features/rolls/roll-search';

type RollSearchStore = {
  criteria: RollSearchCriteria;
  setCriteria: (criteria: RollSearchCriteria) => void;
  updateCriteria: (patch: Partial<RollSearchCriteria>) => void;
  clearCriteria: () => void;
};

export const useRollSearchStore = create<RollSearchStore>((set) => ({
  criteria: EMPTY_ROLL_SEARCH_CRITERIA,
  setCriteria: (criteria) => set({ criteria }),
  updateCriteria: (patch) =>
    set((state) => ({
      criteria: {
        ...state.criteria,
        ...patch,
      },
    })),
  clearCriteria: () => set({ criteria: EMPTY_ROLL_SEARCH_CRITERIA }),
}));

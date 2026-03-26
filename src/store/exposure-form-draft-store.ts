import { create } from 'zustand';

import type { ExposureFormValues } from '@/features/exposures/exposure-form';

type ExposureFormDraftState = {
  drafts: Record<string, ExposureFormValues>;
  setDraft: (key: string, values: ExposureFormValues) => void;
  clearDraft: (key: string) => void;
};

export const useExposureFormDraftStore = create<ExposureFormDraftState>((set) => ({
  drafts: {},
  setDraft: (key, values) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: values,
      },
    })),
  clearDraft: (key) =>
    set((state) => {
      if (!(key in state.drafts)) {
        return state;
      }

      const nextDrafts = { ...state.drafts };
      delete nextDrafts[key];

      return {
        drafts: nextDrafts,
      };
    }),
}));

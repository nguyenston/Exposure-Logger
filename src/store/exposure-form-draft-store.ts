import { create } from 'zustand';

import type { ExposureFormValues } from '@/features/exposures/exposure-form';

export type ExposureFormDraft = {
  values?: ExposureFormValues;
};

type ExposureFormDraftState = {
  drafts: Record<string, ExposureFormDraft>;
  setDraftValues: (key: string, values: ExposureFormValues) => void;
  clearDraftValues: (key: string) => void;
  clearDraft: (key: string) => void;
};

export const useExposureFormDraftStore = create<ExposureFormDraftState>((set) => ({
  drafts: {},
  setDraftValues: (key, values) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: {
          ...state.drafts[key],
          values,
        },
      },
    })),
  clearDraftValues: (key) =>
    set((state) => {
      const currentDraft = state.drafts[key];
      if (!currentDraft?.values) {
        return state;
      }

      const nextDraft = { ...currentDraft };
      delete nextDraft.values;

      const nextDrafts = { ...state.drafts };
      if (Object.keys(nextDraft).length === 0) {
        delete nextDrafts[key];
      } else {
        nextDrafts[key] = nextDraft;
      }

      return {
        drafts: nextDrafts,
      };
    }),
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

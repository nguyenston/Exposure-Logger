import { create } from 'zustand';

type RollDetailPreviewStore = {
  collapsedPreviewSequenceByRollId: Record<string, number>;
  setCollapsedPreviewSequence: (rollId: string, sequenceNumber: number) => void;
  clearCollapsedPreviewSequence: (rollId: string) => void;
};

export const useRollDetailPreviewStore = create<RollDetailPreviewStore>((set) => ({
  collapsedPreviewSequenceByRollId: {},
  setCollapsedPreviewSequence: (rollId, sequenceNumber) =>
    set((state) => ({
      collapsedPreviewSequenceByRollId: {
        ...state.collapsedPreviewSequenceByRollId,
        [rollId]: sequenceNumber,
      },
    })),
  clearCollapsedPreviewSequence: (rollId) =>
    set((state) => {
      const next = { ...state.collapsedPreviewSequenceByRollId };
      delete next[rollId];
      return {
        collapsedPreviewSequenceByRollId: next,
      };
    }),
}));

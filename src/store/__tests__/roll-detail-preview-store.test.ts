import { useRollDetailPreviewStore } from '@/store/roll-detail-preview-store';

describe('roll-detail-preview-store', () => {
  beforeEach(() => {
    useRollDetailPreviewStore.setState({
      collapsedPreviewSequenceByRollId: {},
    });
  });

  it('stores preview sequence numbers per roll', () => {
    useRollDetailPreviewStore.getState().setCollapsedPreviewSequence('roll-a', 12);
    useRollDetailPreviewStore.getState().setCollapsedPreviewSequence('roll-b', 4);

    expect(useRollDetailPreviewStore.getState().collapsedPreviewSequenceByRollId).toEqual({
      'roll-a': 12,
      'roll-b': 4,
    });
  });

  it('clears only the targeted roll preview', () => {
    useRollDetailPreviewStore.getState().setCollapsedPreviewSequence('roll-a', 12);
    useRollDetailPreviewStore.getState().setCollapsedPreviewSequence('roll-b', 4);

    useRollDetailPreviewStore.getState().clearCollapsedPreviewSequence('roll-a');

    expect(useRollDetailPreviewStore.getState().collapsedPreviewSequenceByRollId).toEqual({
      'roll-b': 4,
    });
  });
});

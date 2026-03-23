import { derivePushPullLabel, formatIso, groupRollsByStatus } from '@/features/rolls/roll-utils';

describe('roll-utils', () => {
  it('derives push and pull labels from iso difference', () => {
    expect(derivePushPullLabel(400, 400)).toBe('Box speed');
    expect(derivePushPullLabel(400, 800)).toBe('Push 1 stop');
    expect(derivePushPullLabel(400, 100)).toBe('Pull 2 stops');
  });

  it('formats iso summary text', () => {
    expect(formatIso(400, 1600)).toBe('400 box / 1600 shot');
    expect(formatIso(400, null)).toBe('Box ISO 400');
  });

  it('groups rolls by status', () => {
    const grouped = groupRollsByStatus([
      {
        id: 'r1',
        nickname: 'Downtown',
        camera: 'Nikon F3',
        filmStock: 'Portra 400',
        nativeIso: 400,
        shotIso: 400,
        notes: null,
        status: 'active',
        startedAt: null,
        finishedAt: null,
        createdAt: '2026-03-22T00:00:00.000Z',
        updatedAt: '2026-03-22T00:00:00.000Z',
      },
      {
        id: 'r2',
        nickname: null,
        camera: 'Canon AE-1',
        filmStock: 'HP5+',
        nativeIso: 400,
        shotIso: 1600,
        notes: null,
        status: 'finished',
        startedAt: null,
        finishedAt: null,
        createdAt: '2026-03-22T00:00:00.000Z',
        updatedAt: '2026-03-22T00:00:00.000Z',
      },
    ]);

    expect(grouped.active).toHaveLength(1);
    expect(grouped.finished).toHaveLength(1);
    expect(grouped.archived).toHaveLength(0);
  });
});

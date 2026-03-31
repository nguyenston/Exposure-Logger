import {
  derivePushPullLabel,
  formatIso,
  groupRollsByStatus,
  pickDefaultRoll,
  pickHomeRoll,
} from '@/features/rolls/roll-utils';

const ACTIVE_ROLL = {
  id: 'r1',
  nickname: 'Downtown',
  camera: 'Nikon F3',
  filmStock: 'Portra 400',
  nativeIso: 400,
  shotIso: 400,
  notes: null,
  status: 'active' as const,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-03-22T00:00:00.000Z',
  updatedAt: '2026-03-22T00:00:00.000Z',
};

const FINISHED_ROLL = {
  id: 'r2',
  nickname: null,
  camera: 'Canon AE-1',
  filmStock: 'HP5+',
  nativeIso: 400,
  shotIso: 1600,
  notes: null,
  status: 'finished' as const,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-03-22T00:00:00.000Z',
  updatedAt: '2026-03-23T00:00:00.000Z',
};

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
      ACTIVE_ROLL,
      FINISHED_ROLL,
    ]);

    expect(grouped.active).toHaveLength(1);
    expect(grouped.finished).toHaveLength(1);
    expect(grouped.archived).toHaveLength(0);
  });

  it('prefers the most recently updated active roll by default', () => {
    const defaultRoll = pickDefaultRoll([
      ACTIVE_ROLL,
      {
        ...ACTIVE_ROLL,
        id: 'r3',
        nickname: 'Newer Active',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
      FINISHED_ROLL,
    ]);

    expect(defaultRoll?.id).toBe('r3');
  });

  it('prefers the remembered home roll when it still exists', () => {
    const defaultRoll = pickHomeRoll([ACTIVE_ROLL, FINISHED_ROLL], 'r2');

    expect(defaultRoll?.id).toBe('r2');
  });

  it('falls back to the default roll when the remembered roll is missing', () => {
    const defaultRoll = pickHomeRoll([ACTIVE_ROLL, FINISHED_ROLL], 'missing');

    expect(defaultRoll?.id).toBe('r1');
  });
});

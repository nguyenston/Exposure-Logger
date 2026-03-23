import { SQLiteExposureRepository } from '@/db/repositories/sqlite-exposure-repository';
import { SQLiteGearRepository } from '@/db/repositories/sqlite-gear-repository';
import { SQLiteRollRepository } from '@/db/repositories/sqlite-roll-repository';
import { exposuresTable, rollsTable } from '@/db/schema';

jest.mock('@/db/client', () => ({
  db: {},
}));

function createMockDatabase() {
  const state = {
    rolls: [] as any[],
    exposures: [] as any[],
    gear: [] as any[],
  };

  const query = {
    rollsTable: {
      findFirst: jest.fn(async ({ where }: any) => {
        return state.rolls.find((row) => where(row)) ?? null;
      }),
    },
    exposuresTable: {
      findFirst: jest.fn(async ({ where, orderBy }: any) => {
        const matches = state.exposures.filter((row) => where(row));
        if (orderBy) {
          matches.sort((left, right) => right.sequenceNumber - left.sequenceNumber);
        }
        return matches[0] ?? null;
      }),
    },
    gearRegistryTable: {
      findFirst: jest.fn(async ({ where }: any) => {
        return state.gear.find((row) => where(row)) ?? null;
      }),
    },
  };

  return {
    state,
    query,
    select: jest.fn(() => ({
      from: jest.fn((table: unknown) => {
        const rows =
          table === rollsTable
            ? state.rolls
            : table === exposuresTable
              ? state.exposures
              : state.gear;

        return {
          where: (predicate: (row: any) => boolean) => {
            const filteredRows = rows.filter(predicate);

            return {
              orderBy: async () => filteredRows,
              then: (onFulfilled: (value: any[]) => unknown, onRejected?: (reason: unknown) => unknown) =>
                Promise.resolve(filteredRows).then(onFulfilled, onRejected),
            };
          },
          orderBy: async () => rows,
        };
      }),
    })),
    insert: jest.fn((table: unknown) => ({
      values: async (value: any) => {
        if (table === rollsTable) {
          state.rolls.push(value);
        } else if (table === exposuresTable) {
          state.exposures.push(value);
        } else {
          state.gear.push(value);
        }
      },
    })),
    update: jest.fn((table: unknown) => ({
      set: (value: any) => ({
        where: async (predicate: (row: any) => boolean) => {
          const collection =
            table === rollsTable
              ? state.rolls
              : table === exposuresTable
                ? state.exposures
                : state.gear;
          const index = collection.findIndex((row) => predicate(row));

          if (index >= 0) {
            collection[index] = {
              ...collection[index],
              ...value,
            };
          }
        },
      }),
    })),
    delete: jest.fn((table: unknown) => ({
      where: async (predicate: (row: any) => boolean) => {
        const key = table === rollsTable ? 'rolls' : table === exposuresTable ? 'exposures' : 'gear';
        state[key] = state[key].filter((row) => !predicate(row));
      },
    })),
  };
}

jest.mock('drizzle-orm', () => ({
  asc: () => Symbol('asc'),
  desc: () => Symbol('desc'),
  eq:
    (column: { name: string }, value: unknown) =>
    (row: Record<string, unknown>) =>
      row[column.name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] === value,
  and:
    (...predicates: ((row: Record<string, unknown>) => boolean)[]) =>
    (row: Record<string, unknown>) =>
      predicates.every((predicate) => predicate(row)),
}));

describe('SQLite repositories', () => {
  it('creates and updates a roll', async () => {
    const mockDb = createMockDatabase();
    const repository = new SQLiteRollRepository(mockDb as never);

    const created = await repository.create({
      camera: 'Nikon F3',
      filmStock: 'Kodak Portra 400',
      nativeIso: 400,
      shotIso: 400,
      notes: 'Phase 1 test roll',
      startedAt: '2026-03-21T12:00:00.000Z',
      finishedAt: null,
    });

    const updated = await repository.update(created.id, {
      status: 'finished',
      finishedAt: '2026-03-21T13:00:00.000Z',
    });

    expect(updated.status).toBe('finished');
    expect(updated.finishedAt).toBe('2026-03-21T13:00:00.000Z');
  });

  it('lists gear ordered by type query path', async () => {
    const mockDb = createMockDatabase();
    const repository = new SQLiteGearRepository(mockDb as never);

    await repository.create({
      type: 'lens',
      name: '85mm f/1.8',
      notes: null,
    });

    await repository.create({
      type: 'lens',
      name: '50mm f/1.4',
      notes: null,
    });

    const items = await repository.listByType('lens');

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.type === 'lens')).toBe(true);
  });

  it('auto-increments exposure sequence numbers per roll', async () => {
    const mockDb = createMockDatabase();
    const rollRepository = new SQLiteRollRepository(mockDb as never);
    const exposureRepository = new SQLiteExposureRepository(mockDb as never);

    const roll = await rollRepository.create({
      camera: 'Canon AE-1',
      filmStock: 'Ilford HP5+',
      nativeIso: 400,
      shotIso: 1600,
      notes: null,
      startedAt: '2026-03-21T10:00:00.000Z',
      finishedAt: null,
    });

    const first = await exposureRepository.create({
      rollId: roll.id,
      fStop: 'f/2.8',
      shutterSpeed: '1/125',
      lens: '50mm',
      latitude: null,
      longitude: null,
      locationAccuracy: null,
      capturedAt: '2026-03-21T10:01:00.000Z',
      notes: null,
    });

    const second = await exposureRepository.create({
      rollId: roll.id,
      fStop: 'f/4',
      shutterSpeed: '1/250',
      lens: '50mm',
      latitude: null,
      longitude: null,
      locationAccuracy: null,
      capturedAt: '2026-03-21T10:02:00.000Z',
      notes: null,
    });

    expect(first.sequenceNumber).toBe(1);
    expect(second.sequenceNumber).toBe(2);
  });
});

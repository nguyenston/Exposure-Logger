jest.mock('@/db/client', () => ({
  db: {},
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SQLiteAppSettingsRepository } = require('@/db/repositories/sqlite-app-settings-repository') as typeof import('@/db/repositories/sqlite-app-settings-repository');

type SettingsRow = {
  key: string;
  value: string;
};

function createFakeDatabase(initialRows: SettingsRow[] = []) {
  const rows = [...initialRows];
  const valuesCalls: SettingsRow[] = [];

  const transactionInsertBuilder = {
    values(entry: SettingsRow) {
      valuesCalls.push(entry);
      return {
        onConflictDoUpdate() {
          const existingIndex = rows.findIndex((row) => row.key === entry.key);
          if (existingIndex >= 0) {
            rows[existingIndex] = entry;
          } else {
            rows.push(entry);
          }
          return Promise.resolve();
        },
      };
    },
  };

  const database = {
    select: () => ({
      from: async () => rows,
    }),
    transaction: async (callback: (tx: { insert: () => typeof transactionInsertBuilder }) => Promise<void>) =>
      callback({
        insert: () => transactionInsertBuilder,
      }),
  };

  return {
    database,
    rows,
    valuesCalls,
  };
}

describe('SQLiteAppSettingsRepository', () => {
  it('reads lastOpenedRollId from stored settings', async () => {
    const fakeDatabase = createFakeDatabase([
      {
        key: 'lastOpenedRollId',
        value: 'roll-42',
      },
    ]);
    const repository = new SQLiteAppSettingsRepository(fakeDatabase.database as never);

    const settings = await repository.getSettings();

    expect(settings.lastOpenedRollId).toBe('roll-42');
  });

  it('serializes null lastOpenedRollId as an empty string', async () => {
    const fakeDatabase = createFakeDatabase();
    const repository = new SQLiteAppSettingsRepository(fakeDatabase.database as never);

    await repository.updateSettings({ lastOpenedRollId: null });

    expect(
      fakeDatabase.valuesCalls.find((entry) => entry.key === 'lastOpenedRollId'),
    ).toEqual({
      key: 'lastOpenedRollId',
      value: '',
    });
  });

  it('persists a concrete lastOpenedRollId value', async () => {
    const fakeDatabase = createFakeDatabase();
    const repository = new SQLiteAppSettingsRepository(fakeDatabase.database as never);

    await repository.updateSettings({ lastOpenedRollId: 'roll-99' });

    expect(
      fakeDatabase.valuesCalls.find((entry) => entry.key === 'lastOpenedRollId'),
    ).toEqual({
      key: 'lastOpenedRollId',
      value: 'roll-99',
    });
  });
});

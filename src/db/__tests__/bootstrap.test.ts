import { initializeDatabase } from '@/db/bootstrap';
import { sqlite } from '@/db/client';

jest.mock('@/db/client', () => {
  const sqlite = {
    execSync: jest.fn(),
    getFirstSync: jest.fn(() => ({ user_version: 0 })),
    withTransactionSync: jest.fn((task: () => void) => task()),
  };

  return { sqlite };
});

describe('initializeDatabase', () => {
  it('runs the Phase 1 schema bootstrap and updates user_version', () => {
    initializeDatabase();

    expect(sqlite.getFirstSync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(sqlite.execSync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS rolls'));
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA user_version = 4');
  });
});

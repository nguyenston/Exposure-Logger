import { initializeDatabase, resetDatabaseInitializationForTests } from '@/db/bootstrap';
import { sqlite } from '@/db/client';

jest.mock('@/db/client', () => {
  const sqlite = {
    execSync: jest.fn(),
    getFirstSync: jest.fn(() => ({ user_version: 0 })),
    getAllSync: jest.fn(() => []),
    withTransactionSync: jest.fn((task: () => void) => task()),
  };

  return { sqlite };
});

describe('initializeDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDatabaseInitializationForTests();
  });

  it('runs the Phase 1 schema bootstrap and updates user_version', () => {
    (sqlite.getFirstSync as jest.Mock).mockReturnValue({ user_version: 0 });

    initializeDatabase();

    expect(sqlite.getFirstSync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(sqlite.execSync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS rolls'));
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA user_version = 4');
  });

  it('applies skipped migrations sequentially for older databases', () => {
    (sqlite.getFirstSync as jest.Mock).mockReturnValue({ user_version: 1 });
    (sqlite.getAllSync as jest.Mock).mockReturnValue([]);

    initializeDatabase();

    expect(sqlite.execSync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE rolls ADD COLUMN native_iso'));
    expect(sqlite.execSync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS app_settings'));
    expect(sqlite.execSync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE rolls ADD COLUMN nickname'));
    expect(sqlite.execSync).toHaveBeenCalledWith('PRAGMA user_version = 4');
  });
});

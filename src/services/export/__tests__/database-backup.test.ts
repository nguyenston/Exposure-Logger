import { parseDatabaseBackup } from '@/services/export/database-backup';

describe('parseDatabaseBackup', () => {
  it('parses a valid backup payload', () => {
    const backup = parseDatabaseBackup(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-03-24T00:00:00.000Z',
        rolls: [],
        exposures: [],
        gear: [],
        settings: {
          defaultFStopFromPrevious: true,
          defaultShutterSpeedFromPrevious: true,
          defaultLensFromPrevious: true,
          defaultTimestampToNow: true,
          defaultLocationEnabled: true,
          defaultLocationToCurrent: true,
          exposureStopStep: '1/3',
          voiceTranscriptApplyMode: 'auto_apply',
          libraryExportScope: 'finished_only',
          autoArchiveAfterLibraryExport: true,
        },
      }),
    );

    expect(backup.version).toBe(1);
    expect(backup.rolls).toEqual([]);
  });

  it('rejects unsupported backup versions', () => {
    expect(() =>
      parseDatabaseBackup(
        JSON.stringify({
          version: 99,
          exportedAt: '2026-03-24T00:00:00.000Z',
          rolls: [],
          exposures: [],
          gear: [],
          settings: {},
        }),
      ),
    ).toThrow('Unsupported backup version: 99');
  });
});

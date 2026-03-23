import {
  buildExportCsv,
  escapeCsvValue,
  flattenExportRows,
  selectLibraryExportRolls,
} from '@/services/export/csv-format';
import type { Exposure, Roll } from '@/types/domain';

const baseRoll: Roll = {
  id: 'roll_1',
  nickname: 'Night Walk',
  camera: 'Nikon FM2',
  filmStock: 'HP5+',
  nativeIso: 400,
  shotIso: 1600,
  notes: 'Pushed at the lab',
  status: 'finished',
  startedAt: '2026-03-20T12:00:00.000Z',
  finishedAt: '2026-03-21T12:00:00.000Z',
  createdAt: '2026-03-20T12:00:00.000Z',
  updatedAt: '2026-03-21T12:00:00.000Z',
};

const baseExposure: Exposure = {
  id: 'exp_1',
  rollId: 'roll_1',
  sequenceNumber: 1,
  fStop: 'f/2.8',
  shutterSpeed: '1/60',
  lens: '50mm f/1.8',
  latitude: 40.7128,
  longitude: -74.006,
  locationAccuracy: 12,
  capturedAt: '2026-03-20T13:00:00.000Z',
  notes: 'Corner, "rain", neon',
  createdAt: '2026-03-20T13:00:00.000Z',
  updatedAt: '2026-03-20T13:00:00.000Z',
};

describe('csv-export', () => {
  it('filters whole-library export rolls by scope', () => {
    const archivedRoll: Roll = {
      ...baseRoll,
      id: 'roll_2',
      status: 'archived',
    };
    const activeRoll: Roll = {
      ...baseRoll,
      id: 'roll_3',
      status: 'active',
    };

    expect(selectLibraryExportRolls([baseRoll, archivedRoll, activeRoll], 'finished_only')).toEqual([
      baseRoll,
    ]);
    expect(
      selectLibraryExportRolls([baseRoll, archivedRoll, activeRoll], 'finished_and_archived'),
    ).toEqual([baseRoll, archivedRoll]);
  });

  it('escapes csv values with commas, quotes, and newlines', () => {
    expect(escapeCsvValue('plain')).toBe('plain');
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
    expect(escapeCsvValue('a"b')).toBe('"a""b"');
    expect(escapeCsvValue('a\nb')).toBe('"a\nb"');
  });

  it('builds a flattened csv with roll and exposure fields', () => {
    const rows = flattenExportRows([baseRoll], new Map([[baseRoll.id, [baseExposure]]]));
    const csv = buildExportCsv(rows);

    expect(csv).toContain('rollId,rollNickname,rollStatus');
    expect(csv).toContain('Night Walk');
    expect(csv).toContain('50mm f/1.8');
    expect(csv).toContain('"Corner, ""rain"", neon"');
  });
});

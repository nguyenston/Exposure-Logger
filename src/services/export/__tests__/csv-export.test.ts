import {
  buildExportCsv,
  escapeCsvValue,
  flattenExportRows,
  selectLibraryExportRolls,
} from '@/services/export/csv-format';
import type { Exposure, GearRegistryItem, Roll } from '@/types/domain';

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
  flash: 'SB-800',
  flashPower: '1/4 + 0.5',
  ndStops: '3',
  latitude: 40.7128,
  longitude: -74.006,
  locationAccuracy: 12,
  capturedAt: '2026-03-20T13:00:00.000Z',
  capturedAtOffset: '-04:00',
  notes: 'Corner, "rain", neon',
  createdAt: '2026-03-20T13:00:00.000Z',
  updatedAt: '2026-03-20T13:00:00.000Z',
};

const baseLens: GearRegistryItem = {
  id: 'gear_lens_1',
  type: 'lens',
  name: '50mm f/1.8',
  nickname: null,
  nativeIso: null,
  focalLength: '50mm',
  maxAperture: '1.8',
  mount: 'F',
  serialOrNickname: null,
  notes: null,
  createdAt: '2026-03-20T12:00:00.000Z',
  updatedAt: '2026-03-20T12:00:00.000Z',
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
    const rows = flattenExportRows(
      [baseRoll],
      new Map([[baseRoll.id, [baseExposure]]]),
      new Map([[baseLens.name, baseLens]]),
    );
    const csv = buildExportCsv(rows);

    expect(csv).toContain('rollId,rollNickname,rollStatus');
    expect(csv).toContain('shutterSpeed,ev100,lens');
    expect(csv).toContain('lens,lensFocalLength,flash');
    expect(csv).toContain('capturedAt,capturedAtLocal,capturedAtOffset');
    expect(csv).toContain('Night Walk');
    expect(csv).toContain('50mm f/1.8');
    expect(rows[0]?.ev100).toBe('5.0');
    expect(rows[0]?.lensFocalLength).toBe('50mm');
    expect(csv).toContain('SB-800');
    expect(csv).toContain('1/4 + 0.5');
    expect(csv).toContain(',3,');
    expect(rows[0]?.capturedAtLocal).toBe('2026-03-20T09:00:00');
    expect(rows[0]?.capturedAtOffset).toBe('-04:00');
    expect(csv).toContain('"Corner, ""rain"", neon"');
  });
});

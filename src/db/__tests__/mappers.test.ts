import { mapGearRegistryRow } from '@/db/mappers';

describe('mapGearRegistryRow', () => {
  it('normalizes nullable fields to the domain model', () => {
    const item = mapGearRegistryRow({
      id: 'gear-1',
      type: 'lens',
      name: '50mm f/1.4',
      nickname: null,
      nativeIso: null,
      focalLength: null,
      maxAperture: null,
      mount: null,
      serialOrNickname: null,
      notes: null,
      createdAt: '2026-03-18T12:00:00.000Z',
      updatedAt: '2026-03-18T12:00:00.000Z',
    });

    expect(item).toEqual({
      id: 'gear-1',
      type: 'lens',
      name: '50mm f/1.4',
      nickname: null,
      nativeIso: null,
      focalLength: null,
      maxAperture: null,
      mount: null,
      serialOrNickname: null,
      notes: null,
      createdAt: '2026-03-18T12:00:00.000Z',
      updatedAt: '2026-03-18T12:00:00.000Z',
    });
  });
});

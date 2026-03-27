import { hasExactGearMatch, resolveBestGearMatch, sortGearOptions } from '@/features/gear/gear-utils';

describe('gear-utils', () => {
  const items = [
    {
      id: 'gear-1',
      type: 'lens' as const,
      name: '85mm f/1.8',
      nativeIso: null,
      focalLength: null,
      maxAperture: null,
      mount: null,
      serialOrNickname: null,
      notes: null,
      createdAt: '2026-03-22T00:00:00.000Z',
      updatedAt: '2026-03-22T00:00:00.000Z',
    },
    {
      id: 'gear-2',
      type: 'lens' as const,
      name: '50mm f/1.4',
      nativeIso: null,
      focalLength: null,
      maxAperture: null,
      mount: null,
      serialOrNickname: null,
      notes: null,
      createdAt: '2026-03-22T00:00:00.000Z',
      updatedAt: '2026-03-22T00:00:00.000Z',
    },
  ];

  it('detects exact matches case-insensitively', () => {
    expect(hasExactGearMatch(items, '50MM F/1.4')).toBe(true);
    expect(hasExactGearMatch(items, '35mm')).toBe(false);
  });

  it('prioritizes recent items before alphabetical ordering', () => {
    const sorted = sortGearOptions(items, ['gear-1'], '');

    expect(sorted.map((item) => item.id)).toEqual(['gear-1', 'gear-2']);
  });

  it('filters items by search query', () => {
    const sorted = sortGearOptions(items, [], '50');

    expect(sorted.map((item) => item.id)).toEqual(['gear-2']);
  });

  it('returns the highest-ranked fuzzy match for a query', () => {
    const matched = resolveBestGearMatch(items, '50mm');

    expect(matched?.id).toBe('gear-2');
  });

  it('prefers more complete lens-name matches over partial numeric overlaps', () => {
    const matched = resolveBestGearMatch(
      [
        ...items,
        {
          id: 'gear-3',
          type: 'lens' as const,
          name: 'Voigtlander 40mm f/1.4',
          nativeIso: null,
          focalLength: null,
          maxAperture: null,
          mount: null,
          serialOrNickname: null,
          notes: null,
          createdAt: '2026-03-22T00:00:00.000Z',
          updatedAt: '2026-03-22T00:00:00.000Z',
        },
      ],
      'voigtlander 40',
    );

    expect(matched?.id).toBe('gear-3');
  });
});

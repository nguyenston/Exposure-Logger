import { parseFilmMetadata } from '@/features/gear/film-metadata';

describe('parseFilmMetadata', () => {
  it('parses a terminal numeric speed token with optional T or D suffix', () => {
    expect(parseFilmMetadata('Kodak Vision3 500')).toEqual({ nativeIso: 500 });
    expect(parseFilmMetadata('Kodak Vision3 500T')).toEqual({ nativeIso: 500 });
    expect(parseFilmMetadata('Vision3 50D')).toEqual({ nativeIso: 50 });
  });

  it('ignores names without a terminal numeric speed token', () => {
    expect(parseFilmMetadata('Portra')).toEqual({ nativeIso: null });
    expect(parseFilmMetadata('HP5 Plus')).toEqual({ nativeIso: null });
    expect(parseFilmMetadata('500T Re-spooled')).toEqual({ nativeIso: null });
  });
});

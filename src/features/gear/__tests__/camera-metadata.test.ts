import { parseCameraMetadata } from '@/features/gear/camera-metadata';

describe('camera-metadata', () => {
  it('parses nickname (name) camera input', () => {
    expect(parseCameraMetadata('Black F3 (Nikon F3)')).toEqual({
      name: 'Nikon F3',
      nickname: 'Black F3',
    });
  });

  it('falls back to plain name when no nickname syntax is present', () => {
    expect(parseCameraMetadata('Nikon F3')).toEqual({
      name: 'Nikon F3',
      nickname: null,
    });
  });

  it('falls back to plain name when either side of nickname syntax is empty', () => {
    expect(parseCameraMetadata('(Nikon F3)')).toEqual({
      name: '(Nikon F3)',
      nickname: null,
    });
    expect(parseCameraMetadata('Black F3 ()')).toEqual({
      name: 'Black F3 ()',
      nickname: null,
    });
  });
});

import { parseExposureTranscript } from '@/features/exposures/voice-transcript';

describe('parseExposureTranscript', () => {
  it('parses explicit aperture, shutter, lens, and notes commands', () => {
    const parsed = parseExposureTranscript(
      'f stop 2.8 at 60 lens Voigtlander 40mm notes storefront at dusk',
      '1/3',
    );

    expect(parsed.fStop).toBe('f/2.8');
    expect(parsed.shutterSpeed).toBe('1/60');
    expect(parsed.lens).toBe('Voigtlander 40mm');
    expect(parsed.notes).toBe('storefront at dusk');
  });

  it('parses spoken aperture and timed shutter values', () => {
    const parsed = parseExposureTranscript('aperture two point eight shutter two seconds', '1/3');

    expect(parsed.fStop).toBe('f/2.8');
    expect(parsed.shutterSpeed).toBe('2s');
  });

  it('does not treat an unlabeled lens number as shutter speed', () => {
    const parsed = parseExposureTranscript('lens 50mm', '1/3');

    expect(parsed.fStop).toBeNull();
    expect(parsed.shutterSpeed).toBeNull();
    expect(parsed.lens).toBe('50mm');
  });
});

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

  it('accepts lenz as a lens keyword alias', () => {
    const parsed = parseExposureTranscript('lenz 50mm notes storefront', '1/3');

    expect(parsed.lens).toBe('50mm');
    expect(parsed.notes).toBe('storefront');
  });

  it('defaults notes to append mode', () => {
    const parsed = parseExposureTranscript('notes storefront at dusk', '1/3');

    expect(parsed.notes).toBe('storefront at dusk');
    expect(parsed.notesMode).toBe('append');
  });

  it('supports note overwrite commands', () => {
    const parsed = parseExposureTranscript('notes overwrite this frame', '1/3');

    expect(parsed.notes).toBe('this frame');
    expect(parsed.notesMode).toBe('replace');
  });

  it('does not parse f-stop or shutter values out of notes text', () => {
    const parsed = parseExposureTranscript('notes testing 1 2 3', '1/3');

    expect(parsed.fStop).toBeNull();
    expect(parsed.shutterSpeed).toBeNull();
    expect(parsed.notes).toBe('testing 1 2 3');
  });

  it('parses shorthand aperture and shutter phrases', () => {
    const parsed = parseExposureTranscript('f 5.6 at 100', '1/3');

    expect(parsed.fStop).toBe('f/5.6');
    expect(parsed.shutterSpeed).toBe('1/100');
  });

  it('parses hyphenated aperture transcripts like f-16', () => {
    const parsed = parseExposureTranscript('f-16 at 125', '1/3');

    expect(parsed.fStop).toBe('f/16');
    expect(parsed.shutterSpeed).toBe('1/125');
  });

  it('parses compact aperture transcripts like f11', () => {
    const parsed = parseExposureTranscript('f11 at 125', '1/3');

    expect(parsed.fStop).toBe('f/11');
    expect(parsed.shutterSpeed).toBe('1/125');
  });

  it('normalizes punctuation noise inside numeric voice transcripts', () => {
    const parsed = parseExposureTranscript('f 3.5 at 6:40', '1/3');

    expect(parsed.fStop).toBe('f/3.5');
    expect(parsed.shutterSpeed).toBe('1/640');
  });

  it('parses a numeric frame command', () => {
    const parsed = parseExposureTranscript('frame 12 f 5.6 at 125', '1/3');

    expect(parsed.frame).toBe(12);
    expect(parsed.matchedFields).toContain('frame');
    expect(parsed.fStop).toBe('f/5.6');
    expect(parsed.shutterSpeed).toBe('1/125');
  });

  it('parses a spoken frame command', () => {
    const parsed = parseExposureTranscript('frame six notes storefront', '1/3');

    expect(parsed.frame).toBe(6);
    expect(parsed.notes).toBe('storefront');
  });

  it('accepts common speech-to-text frame aliases like for -> four', () => {
    const parsed = parseExposureTranscript('frame for f 8 at 125', '1/3');

    expect(parsed.frame).toBe(4);
    expect(parsed.fStop).toBe('f/8');
    expect(parsed.shutterSpeed).toBe('1/125');
  });
});

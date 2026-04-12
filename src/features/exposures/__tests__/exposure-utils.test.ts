import { formatEv100 } from '@/features/exposures/exposure-utils';

describe('exposure-utils', () => {
  it('rounds EV display to the configured stop increment', () => {
    expect(formatEv100('f/2.8', '1/60', 1600, '1')).toBe('EV 5');
    expect(formatEv100('f/2.8', '1/60', 1600, '1/2')).toBe('EV 5.0');
    expect(formatEv100('f/2.8', '1/60', 1600, '1/3')).toBe('EV 5.0');
  });

  it('returns unavailable when aperture or shutter cannot be parsed', () => {
    expect(formatEv100('', '1/60', 400, '1/3')).toBe('EV unavailable');
    expect(formatEv100('f/4', '', 400, '1/3')).toBe('EV unavailable');
  });
});

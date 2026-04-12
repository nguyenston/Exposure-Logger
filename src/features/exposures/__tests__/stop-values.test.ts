import {
  formatNdStops,
  getNdStopOptions,
  getFlashPowerOptions,
  parseNdStopsToUnits,
} from '@/features/exposures/stop-values';

describe('stop-values helpers', () => {
  it('builds flash power labels using the configured step size', () => {
    expect(getFlashPowerOptions('1').slice(0, 4)).toEqual(['1/1', '1/2', '1/4', '1/8']);
    expect(getFlashPowerOptions('1/2').slice(0, 4)).toEqual(['1/1', '1/2 + 0.5', '1/2', '1/4 + 0.5']);
    expect(getFlashPowerOptions('1/3').slice(0, 5)).toEqual([
      '1/1',
      '1/2 + 0.7',
      '1/2 + 0.3',
      '1/2',
      '1/4 + 0.7',
    ]);
  });

  it('formats and parses ND stop values with the configured step size', () => {
    expect(formatNdStops(3, '1')).toBe('3');
    expect(formatNdStops(3, '1/2')).toBe('1.5');
    expect(formatNdStops(4, '1/3')).toBe('1.3');

    expect(parseNdStopsToUnits('3', '1')).toBe(3);
    expect(parseNdStopsToUnits('1.5', '1/2')).toBe(3);
    expect(parseNdStopsToUnits('1.3', '1/3')).toBe(4);
  });

  it('builds ND stop picker options for the configured step size', () => {
    expect(getNdStopOptions('1').slice(0, 4)).toEqual(['No ND', '1', '2', '3']);
    expect(getNdStopOptions('1/2').slice(0, 4)).toEqual(['No ND', '0.5', '1', '1.5']);
    expect(getNdStopOptions('1/3').slice(0, 4)).toEqual(['No ND', '0.3', '0.7', '1']);
    expect(getNdStopOptions('1/3').at(-1)).toBe('10');
  });
});

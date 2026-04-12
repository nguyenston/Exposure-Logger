import type { ExposureStopStep } from '@/types/settings';

const F_STOPS_BY_STEP: Record<ExposureStopStep, string[]> = {
  '1': ['f/1', 'f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11', 'f/16', 'f/22'],
  '1/2': [
    'f/1',
    'f/1.2',
    'f/1.4',
    'f/1.7',
    'f/2',
    'f/2.4',
    'f/2.8',
    'f/3.3',
    'f/4',
    'f/4.8',
    'f/5.6',
    'f/6.7',
    'f/8',
    'f/9.5',
    'f/11',
    'f/13',
    'f/16',
    'f/19',
    'f/22',
  ],
  '1/3': [
    'f/1',
    'f/1.1',
    'f/1.2',
    'f/1.4',
    'f/1.6',
    'f/1.8',
    'f/2',
    'f/2.2',
    'f/2.5',
    'f/2.8',
    'f/3.2',
    'f/3.5',
    'f/4',
    'f/4.5',
    'f/5',
    'f/5.6',
    'f/6.3',
    'f/7.1',
    'f/8',
    'f/9',
    'f/10',
    'f/11',
    'f/13',
    'f/14',
    'f/16',
    'f/18',
    'f/20',
    'f/22',
  ],
};

const SHUTTER_SPEEDS_BY_STEP: Record<ExposureStopStep, string[]> = {
  '1': ['8s', '4s', '2s', '1s', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000'],
  '1/2': [
    '8s',
    '6s',
    '4s',
    '3s',
    '2s',
    '1.5s',
    '1s',
    '0.7s',
    '1/2',
    '1/3',
    '1/4',
    '1/6',
    '1/8',
    '1/10',
    '1/15',
    '1/20',
    '1/30',
    '1/45',
    '1/60',
    '1/90',
    '1/125',
    '1/180',
    '1/250',
    '1/350',
    '1/500',
    '1/750',
    '1/1000',
  ],
  '1/3': [
    '8s',
    '6s',
    '5s',
    '4s',
    '3s',
    '2.5s',
    '2s',
    '1.6s',
    '1.3s',
    '1s',
    '0.8s',
    '0.6s',
    '1/2',
    '1/3',
    '1/4',
    '1/5',
    '1/6',
    '1/8',
    '1/10',
    '1/13',
    '1/15',
    '1/20',
    '1/25',
    '1/30',
    '1/40',
    '1/50',
    '1/60',
    '1/80',
    '1/100',
    '1/125',
    '1/160',
    '1/200',
    '1/250',
    '1/320',
    '1/400',
    '1/500',
    '1/640',
    '1/800',
    '1/1000',
  ],
};

export function getFStopOptions(step: ExposureStopStep) {
  return F_STOPS_BY_STEP[step];
}

export function getShutterSpeedOptions(step: ExposureStopStep) {
  return SHUTTER_SPEEDS_BY_STEP[step];
}

const FLASH_POWER_FULL_STOPS = ['1/1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'];

export function getFlashPowerOptions(step: ExposureStopStep) {
  if (step === '1') {
    return FLASH_POWER_FULL_STOPS;
  }

  const options = [FLASH_POWER_FULL_STOPS[0]];

  FLASH_POWER_FULL_STOPS.slice(1).forEach((baseLabel) => {
    if (step === '1/2') {
      options.push(`${baseLabel} + 0.5`);
    } else {
      options.push(`${baseLabel} + 0.7`, `${baseLabel} + 0.3`);
    }

    options.push(baseLabel);
  });

  return options;
}

export function getNdStopOptions(step: ExposureStopStep) {
  const denominator = getStopStepDenominator(step);
  const maxStopUnits = 10 * denominator;
  const options = ['No ND'];

  for (let units = 1; units <= maxStopUnits; units++) {
    const label = formatNdStops(units, step);
    if (label) {
      options.push(label);
    }
  }

  return options;
}

function getStopStepDenominator(step: ExposureStopStep) {
  if (step === '1') {
    return 1;
  }

  if (step === '1/2') {
    return 2;
  }

  return 3;
}

export function formatNdStops(units: number, step: ExposureStopStep) {
  if (units <= 0) {
    return null;
  }

  if (step === '1') {
    return String(units);
  }

  if (step === '1/2') {
    return units % 2 === 0 ? String(units / 2) : `${Math.floor(units / 2)}.5`.replace(/^0\./, '0.');
  }

  const wholeStops = Math.floor(units / 3);
  const remainder = units % 3;

  if (remainder === 0) {
    return String(wholeStops);
  }

  if (remainder === 1) {
    return wholeStops === 0 ? '0.3' : `${wholeStops}.3`;
  }

  return wholeStops === 0 ? '0.7' : `${wholeStops}.7`;
}

export function parseNdStopsToUnits(value: string | null | undefined, step: ExposureStopStep) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return Math.max(1, Math.round(numeric * getStopStepDenominator(step)));
}

import { getLocalTimestampMetadata } from '@/lib/time';
import type { Exposure } from '@/types/domain';
import type { ExposureDefaultsSettings, ExposureStopStep } from '@/types/settings';

import type { ExposureFormValues } from './exposure-form';

function formatCoordinate(value: number | null) {
  if (value === null) {
    return '';
  }

  return String(value);
}

/**
 * Builds the add-exposure form state from the previous exposure plus the current
 * defaulting settings, so "inherit from previous" stays centralized in one place.
 */
export function buildExposureInitialValues(
  previousExposure: Exposure | null,
  settings: ExposureDefaultsSettings,
): ExposureFormValues {
  const nowMetadata = getLocalTimestampMetadata();
  const useCurrentTimestamp = settings.defaultTimestampToNow;

  return {
    fStop: settings.defaultFStopFromPrevious ? previousExposure?.fStop ?? '' : '',
    shutterSpeed: settings.defaultShutterSpeedFromPrevious
      ? previousExposure?.shutterSpeed ?? ''
      : '',
    lens: settings.defaultLensFromPrevious ? previousExposure?.lens ?? null : null,
    flash: null,
    flashPower: null,
    ndStops: null,
    capturedAt: useCurrentTimestamp ? nowMetadata.capturedAt : previousExposure?.capturedAt ?? '',
    capturedAtOffset: useCurrentTimestamp
      ? nowMetadata.capturedAtOffset
      : previousExposure?.capturedAtOffset ?? nowMetadata.capturedAtOffset,
    notes: '',
    latitude: '',
    longitude: '',
    locationAccuracy: '',
  };
}

export function buildExposureEditValues(exposure: Exposure): ExposureFormValues {
  return {
    fStop: exposure.fStop,
    shutterSpeed: exposure.shutterSpeed,
    lens: exposure.lens,
    flash: exposure.flash,
    flashPower: exposure.flashPower,
    ndStops: exposure.ndStops,
    capturedAt: exposure.capturedAt,
    capturedAtOffset: exposure.capturedAtOffset,
    notes: exposure.notes ?? '',
    latitude: formatCoordinate(exposure.latitude),
    longitude: formatCoordinate(exposure.longitude),
    locationAccuracy: formatCoordinate(exposure.locationAccuracy),
  };
}

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) {
    return null;
  }

  return numeric;
}

/**
 * Converts UI form strings into the repository payload shape, including trimming
 * text fields and collapsing incomplete location input back to nulls.
 */
export function normalizeExposureForm(values: ExposureFormValues) {
  const hasLocationValues =
    values.latitude.trim() || values.longitude.trim() || values.locationAccuracy.trim();

  return {
    fStop: values.fStop.trim(),
    shutterSpeed: values.shutterSpeed.trim(),
    lens: values.lens?.trim() ? values.lens.trim() : null,
    flash: values.flash?.trim() ? values.flash.trim() : null,
    flashPower: values.flashPower?.trim() ? values.flashPower.trim() : null,
    ndStops: values.ndStops?.trim() ? values.ndStops.trim() : null,
    capturedAt: values.capturedAt.trim(),
    capturedAtOffset: values.capturedAtOffset?.trim() ? values.capturedAtOffset.trim() : null,
    notes: values.notes.trim() ? values.notes.trim() : null,
    latitude: hasLocationValues ? parseNumber(values.latitude) : null,
    longitude: hasLocationValues ? parseNumber(values.longitude) : null,
    locationAccuracy: hasLocationValues ? parseNumber(values.locationAccuracy) : null,
  };
}

export function formatExposureTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseFStop(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.startsWith('f/') ? trimmed.slice(2) : trimmed;
  const numeric = Number(normalized);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * Normalizes shutter input into seconds so EV math can work for both fractional
 * speeds like 1/125 and timed speeds like 2s.
 */
function parseShutterSeconds(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  if (trimmed.endsWith('s')) {
    const numeric = Number(trimmed.slice(0, -1));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  if (trimmed.includes('/')) {
    const [numeratorText, denominatorText] = trimmed.split('/');
    const numerator = Number(numeratorText);
    const denominator = Number(denominatorText);

    if (
      Number.isFinite(numerator) &&
      Number.isFinite(denominator) &&
      numerator > 0 &&
      denominator > 0
    ) {
      return numerator / denominator;
    }

    return null;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * Computes EV relative to ISO 100 while still accepting a roll shot ISO, so the
 * display stays comparable across pushed or pulled rolls.
 */
export function computeEv100(fStop: string, shutterSpeed: string, shotIso: number | null) {
  const aperture = parseFStop(fStop);
  const seconds = parseShutterSeconds(shutterSpeed);
  const iso = shotIso && shotIso > 0 ? shotIso : 100;

  if (!aperture || !seconds) {
    return null;
  }

  const ev100 = Math.log2(((aperture * aperture) / seconds) * (100 / iso));
  if (!Number.isFinite(ev100)) {
    return null;
  }

  return ev100;
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

export function roundEvToStopStep(ev100: number, step: ExposureStopStep) {
  const denominator = getStopStepDenominator(step);
  return Math.round(ev100 * denominator) / denominator;
}

export function formatRoundedEvValue(ev100: number, step: ExposureStopStep) {
  const rounded = roundEvToStopStep(ev100, step);
  return step === '1' ? String(Math.round(rounded)) : rounded.toFixed(1);
}

export function formatEv100(
  fStop: string,
  shutterSpeed: string,
  shotIso: number | null,
  step: ExposureStopStep = '1/3',
) {
  const ev100 = computeEv100(fStop, shutterSpeed, shotIso);

  return ev100 === null ? 'EV unavailable' : `EV ${formatRoundedEvValue(ev100, step)}`;
}

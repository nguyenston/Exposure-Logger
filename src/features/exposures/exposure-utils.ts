import { nowIsoString } from '@/lib/time';
import type { Exposure } from '@/types/domain';
import type { ExposureDefaultsSettings } from '@/types/settings';

import type { ExposureFormValues } from './exposure-form';

function formatCoordinate(value: number | null) {
  if (value === null) {
    return '';
  }

  return String(value);
}

export function buildExposureInitialValues(
  previousExposure: Exposure | null,
  settings: ExposureDefaultsSettings,
): ExposureFormValues {
  return {
    fStop: settings.defaultFStopFromPrevious ? previousExposure?.fStop ?? '' : '',
    shutterSpeed: settings.defaultShutterSpeedFromPrevious
      ? previousExposure?.shutterSpeed ?? ''
      : '',
    lens: settings.defaultLensFromPrevious ? previousExposure?.lens ?? null : null,
    capturedAt: settings.defaultTimestampToNow ? nowIsoString() : previousExposure?.capturedAt ?? '',
    notes: '',
    locationEnabled: settings.defaultLocationEnabled,
    latitude: settings.defaultLocationEnabled ? formatCoordinate(previousExposure?.latitude ?? null) : '',
    longitude: settings.defaultLocationEnabled
      ? formatCoordinate(previousExposure?.longitude ?? null)
      : '',
    locationAccuracy: settings.defaultLocationEnabled
      ? formatCoordinate(previousExposure?.locationAccuracy ?? null)
      : '',
  };
}

export function buildExposureEditValues(exposure: Exposure): ExposureFormValues {
  const locationEnabled =
    exposure.latitude !== null || exposure.longitude !== null || exposure.locationAccuracy !== null;

  return {
    fStop: exposure.fStop,
    shutterSpeed: exposure.shutterSpeed,
    lens: exposure.lens,
    capturedAt: exposure.capturedAt,
    notes: exposure.notes ?? '',
    locationEnabled,
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

export function normalizeExposureForm(values: ExposureFormValues) {
  const hasLocationValues =
    values.latitude.trim() || values.longitude.trim() || values.locationAccuracy.trim();

  return {
    fStop: values.fStop.trim(),
    shutterSpeed: values.shutterSpeed.trim(),
    lens: values.lens?.trim() ? values.lens.trim() : null,
    capturedAt: values.capturedAt.trim(),
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

  return Math.round(ev100 * 10) / 10;
}

export function formatEv100(fStop: string, shutterSpeed: string, shotIso: number | null) {
  const ev100 = computeEv100(fStop, shutterSpeed, shotIso);

  return ev100 === null ? 'EV unavailable' : `EV ${ev100.toFixed(1)}`;
}

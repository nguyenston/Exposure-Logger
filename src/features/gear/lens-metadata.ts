export type ParsedLensMetadata = {
  focalLength: string | null;
  maxAperture: string | null;
};

function normalizeFocalLength(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase().endsWith('mm') ? trimmed : `${trimmed}mm`;
}

function normalizeMaxAperture(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase().startsWith('f/')
    ? `f/${trimmed.slice(2)}`
    : trimmed.toLowerCase().startsWith('f')
      ? `f/${trimmed.slice(1)}`
      : `f/${trimmed}`;
}

export function parseLensMetadata(name: string): ParsedLensMetadata {
  const normalized = name.trim();
  if (!normalized) {
    return {
      focalLength: null,
      maxAperture: null,
    };
  }

  const focalLengthMatch =
    /(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*mm\b/i.exec(normalized) ??
    /(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\b(?=\s*(?:f\/|f\d|1:))/i.exec(normalized);

  const maxApertureMatch =
    /\bf\/\s*(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\b/i.exec(normalized) ??
    /\bf\s*(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\b/i.exec(normalized) ??
    /\b1:(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\b/i.exec(normalized);

  return {
    focalLength: focalLengthMatch ? normalizeFocalLength(focalLengthMatch[1].replace(/\s+/g, '')) : null,
    maxAperture: maxApertureMatch ? normalizeMaxAperture(maxApertureMatch[1].replace(/\s+/g, '')) : null,
  };
}

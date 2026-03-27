type ParsedFilmMetadata = {
  nativeIso: number | null;
};

const ISO_PATTERN = /(?:^|\s)(\d{2,5})(?:[TD])?$/i;

export function parseFilmMetadata(name: string): ParsedFilmMetadata {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      nativeIso: null,
    };
  }

  const match = trimmed.match(ISO_PATTERN);

  return {
    nativeIso: match ? Number.parseInt(match[1], 10) : null,
  };
}

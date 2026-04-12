export function nowIsoString() {
  return new Date().toISOString();
}

export function formatUtcOffset(date: Date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getLocalTimestampMetadata(date = new Date()) {
  return {
    capturedAt: date.toISOString(),
    capturedAtOffset: formatUtcOffset(date),
  };
}

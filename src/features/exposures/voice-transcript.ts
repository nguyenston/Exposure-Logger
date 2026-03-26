import { getFStopOptions, getShutterSpeedOptions } from '@/features/exposures/stop-values';
import type { ExposureStopStep } from '@/types/settings';

type ParsedExposureField = 'fStop' | 'shutterSpeed' | 'lens' | 'notes' | 'frame';

export type ParsedExposureTranscript = {
  transcript: string;
  fStop: string | null;
  shutterSpeed: string | null;
  lens: string | null;
  notes: string | null;
  frame: number | null;
  notesMode: 'append' | 'replace';
  matchedFields: ParsedExposureField[];
};

type AliasMap = Map<string, string[]>;

const SMALL_NUMBER_WORDS: Record<number, string> = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
};

const TENS_WORDS: Record<number, string> = {
  20: 'twenty',
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTranscript(value: string) {
  const lowerCased = value.toLowerCase();
  const notesMatch = /\bnote(?:s)?\b/.exec(lowerCased);
  const beforeNotes = notesMatch ? lowerCased.slice(0, notesMatch.index) : lowerCased;
  const afterNotes = notesMatch ? lowerCased.slice(notesMatch.index) : '';
  const normalizedBeforeNotes = beforeNotes
    .replace(/(\d)[:\-](\d)/g, '$1$2')
    .replace(/([a-z])-(\d)/g, '$1 $2')
    .replace(/\bf(\d+(?:\.\d+)?)\b/g, 'f $1');

  return `${normalizedBeforeNotes}${afterNotes}`
    .replace(/[,;:!?()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function integerToWords(value: number): string {
  if (value < 20) {
    return SMALL_NUMBER_WORDS[value] ?? String(value);
  }

  if (value < 100) {
    const tens = Math.floor(value / 10) * 10;
    const remainder = value % 10;
    return remainder === 0
      ? TENS_WORDS[tens]
      : `${TENS_WORDS[tens]} ${SMALL_NUMBER_WORDS[remainder]}`;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    return remainder === 0
      ? `${SMALL_NUMBER_WORDS[hundreds]} hundred`
      : `${SMALL_NUMBER_WORDS[hundreds]} hundred ${integerToWords(remainder)}`;
  }

  if (value === 1000) {
    return 'one thousand';
  }

  return String(value);
}

function numberToWords(value: string) {
  if (value.includes('.')) {
    const [wholeText, decimalText] = value.split('.');
    const whole = Number(wholeText);
    if (!Number.isFinite(whole)) {
      return value;
    }

    const decimalWords = decimalText
      .split('')
      .map((digit) => SMALL_NUMBER_WORDS[Number(digit)] ?? digit)
      .join(' ');

    return `${integerToWords(whole)} point ${decimalWords}`.trim();
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return integerToWords(numeric);
}

function addAliases(map: AliasMap, option: string, aliases: string[]) {
  map.set(
    option,
    Array.from(
      new Set(
        aliases
          .map(normalizeTranscript)
          .filter(Boolean),
      ),
    ),
  );
}

function buildFStopAliases(step: ExposureStopStep) {
  const map: AliasMap = new Map();

  getFStopOptions(step).forEach((option) => {
    const numeric = option.replace('f/', '');
    const spoken = numberToWords(numeric);

    addAliases(map, option, [
      option,
      numeric,
      `f ${numeric}`,
      `f stop ${numeric}`,
      `fstop ${numeric}`,
      `aperture ${numeric}`,
      `f ${spoken}`,
      `f stop ${spoken}`,
      `fstop ${spoken}`,
      `aperture ${spoken}`,
      spoken,
    ]);
  });

  return map;
}

function buildShutterAliases(step: ExposureStopStep) {
  const map: AliasMap = new Map();

  getShutterSpeedOptions(step).forEach((option) => {
    if (option.endsWith('s')) {
      const seconds = option.slice(0, -1);
      const spoken = numberToWords(seconds);
      addAliases(map, option, [
        option,
        seconds,
        `${seconds} second`,
        `${seconds} seconds`,
        `shutter ${seconds}`,
        `speed ${seconds}`,
        `for ${seconds}`,
        `at ${seconds}`,
        `${spoken} second`,
        `${spoken} seconds`,
        `shutter ${spoken}`,
        `speed ${spoken}`,
        `for ${spoken}`,
        `at ${spoken}`,
      ]);
      return;
    }

    const [, denominator] = option.split('/');
    const spoken = numberToWords(denominator);
    addAliases(map, option, [
      option,
      denominator,
      `1 ${denominator}`,
      `1 over ${denominator}`,
      `shutter ${denominator}`,
      `speed ${denominator}`,
      `at ${denominator}`,
      `for ${denominator}`,
      spoken,
      `one ${spoken}`,
      `one over ${spoken}`,
      `shutter ${spoken}`,
      `speed ${spoken}`,
      `at ${spoken}`,
      `for ${spoken}`,
    ]);
  });

  return map;
}

function findOptionByAlias(text: string, aliases: AliasMap) {
  const normalized = normalizeTranscript(text);
  let bestMatch: string | null = null;
  let bestAliasLength = -1;

  aliases.forEach((optionAliases, option) => {
    optionAliases.forEach((alias) => {
      const pattern = new RegExp(`(^|\\s)${escapeRegExp(alias)}(?=\\s|$)`, 'i');
      if (!pattern.test(normalized)) {
        return;
      }

      if (alias.length > bestAliasLength) {
        bestMatch = option;
        bestAliasLength = alias.length;
      }
    });
  });

  return bestMatch;
}

function extractKeywordSegment(
  value: string,
  keywordPattern: string,
  stopPattern = 'lens|lenz|note|notes',
) {
  const match = new RegExp(`(?:^|\\b)(?:${keywordPattern})\\b\\s+(.+?)(?=\\b(?:${stopPattern})\\b|$)`, 'i').exec(
    value,
  );

  return match?.[1]?.trim() ?? null;
}

function cleanFreeText(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed : null;
}

function getNotesMode(transcript: string) {
  const normalized = normalizeTranscript(transcript);
  return /\bnote(?:s)?\s+(?:overwrite|replace)\b/i.test(normalized) ? 'replace' : 'append';
}

function normalizeNotesText(value: string | null) {
  if (!value) {
    return null;
  }

  return cleanFreeText(value.replace(/^(?:overwrite|replace)\s+/i, ''));
}

function parseFrameValue(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizeTranscript(value);
  const digitMatch = /^(\d{1,4})\b/.exec(normalized);
  if (digitMatch) {
    const parsed = Number.parseInt(digitMatch[1], 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  for (let candidate = 1000; candidate >= 1; candidate -= 1) {
    if (normalized.startsWith(integerToWords(candidate))) {
      return candidate;
    }
  }

  return null;
}

export function parseExposureTranscript(
  transcript: string,
  stopStep: ExposureStopStep,
): ParsedExposureTranscript {
  const normalized = normalizeTranscript(transcript);
  const fStopAliases = buildFStopAliases(stopStep);
  const shutterAliases = buildShutterAliases(stopStep);
  const fStopSegment = extractKeywordSegment(normalized, 'f|f stop|fstop|aperture');
  const shutterSegment = extractKeywordSegment(normalized, 'shutter|speed|at|for');

  const fStop = fStopSegment ? findOptionByAlias(fStopSegment, fStopAliases) ?? null : null;
  const shutterSpeed = shutterSegment ? findOptionByAlias(shutterSegment, shutterAliases) ?? null : null;

  const lens = cleanFreeText(extractKeywordSegment(transcript, 'lens|lenz'));
  const notes = normalizeNotesText(extractKeywordSegment(transcript, 'note|notes'));
  const frame = parseFrameValue(extractKeywordSegment(normalized, 'frame', 'lens|lenz|note|notes'));
  const notesMode = getNotesMode(transcript);

  const matchedFields: ParsedExposureField[] = [];
  if (fStop) {
    matchedFields.push('fStop');
  }
  if (shutterSpeed) {
    matchedFields.push('shutterSpeed');
  }
  if (lens) {
    matchedFields.push('lens');
  }
  if (notes) {
    matchedFields.push('notes');
  }
  if (frame) {
    matchedFields.push('frame');
  }

  return {
    transcript,
    fStop,
    shutterSpeed,
    lens,
    notes,
    frame,
    notesMode,
    matchedFields,
  };
}

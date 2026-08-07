import type { AuditLocale } from '../../../domain/audit-locale.util';

const FR_MARKERS: ReadonlyArray<string> = [
  ' le ',
  ' la ',
  ' les ',
  ' des ',
  ' pour ',
  ' avec ',
  ' votre ',
  ' audit ',
  ' optimisation ',
  ' conversion ',
  ' impact ',
];

const EN_MARKERS: ReadonlyArray<string> = [
  ' the ',
  ' and ',
  ' for ',
  ' with ',
  ' your ',
  ' audit ',
  ' optimization ',
  ' conversion ',
  ' impact ',
  ' priority ',
  ' implementation ',
];

const STRONG_LANGUAGE_MARKER_THRESHOLD = 4;

function markerCount(text: string, markers: ReadonlyArray<string>): number {
  return markers.reduce<number>((count, marker) => {
    return text.includes(marker) ? count + 1 : count;
  }, 0);
}

export function hasLanguageMismatch(
  text: string,
  locale: AuditLocale,
): boolean {
  const normalized = ` ${text.toLowerCase().replace(/[^a-z0-9'\s]/g, ' ')} `;
  const frCount = markerCount(normalized, FR_MARKERS);
  const enCount = markerCount(normalized, EN_MARKERS);

  const mixedStrong =
    frCount >= STRONG_LANGUAGE_MARKER_THRESHOLD &&
    enCount >= STRONG_LANGUAGE_MARKER_THRESHOLD;
  if (mixedStrong) return true;

  if (locale === 'fr') {
    return enCount >= STRONG_LANGUAGE_MARKER_THRESHOLD && enCount > frCount;
  }
  return frCount >= STRONG_LANGUAGE_MARKER_THRESHOLD && frCount > enCount;
}

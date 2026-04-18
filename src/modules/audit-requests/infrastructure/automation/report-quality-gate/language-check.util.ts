import type { AuditLocale } from '../../../domain/audit-locale.util';

/**
 * Markers lexicaux les plus frequents en francais — utilises comme
 * heuristique de detection de langue quand le LLM derape et melange
 * FR/EN dans une meme section.
 */
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

/** Markers lexicaux les plus frequents en anglais. */
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

/** Seuil a partir duquel une langue est consideree comme "forte" dans le texte. */
const STRONG_LANGUAGE_MARKER_THRESHOLD = 4;

function markerCount(text: string, markers: ReadonlyArray<string>): number {
  return markers.reduce<number>((count, marker) => {
    return text.includes(marker) ? count + 1 : count;
  }, 0);
}

/**
 * Detecte si un corpus texte contient un melange francais/anglais
 * suffisamment fort pour considerer qu'il y a une incoherence de langue,
 * ou si la langue dominante ne correspond pas a la locale attendue.
 *
 * Extrait du god-object `ReportQualityGateService` pour rendre l'heuristique
 * testable isolement et permettre l'evolution future (NLP plus fin, stopwords,
 * detection de langue via librairie dediee).
 */
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

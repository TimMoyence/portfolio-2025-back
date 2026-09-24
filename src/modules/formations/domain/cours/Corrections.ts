import type { Cours, Ecran } from '../contrats/cours';

export function ecranCorrigePar(ecran: Ecran): string | null {
  if (ecran.brique === 'fp-worked') {
    return ecran.proprietes.corrigeDe ?? null;
  }
  if (ecran.brique !== 'fp-story') {
    return null;
  }
  const presentation = ecran.proprietes.presentation;
  if (
    presentation?.version === 2 &&
    (presentation.renderer === 'sort-review' ||
      presentation.renderer === 'answer-review')
  ) {
    return presentation.props.source.screenId;
  }
  return null;
}

export function sourcesAReveler(
  cours: Cours,
  dernierRangAtteint: number,
): readonly string[] {
  return cours.ecrans
    .slice(0, dernierRangAtteint + 1)
    .map((ecran) => ecranCorrigePar(ecran))
    .filter((source): source is string => source !== null);
}

export function correctionsDe(
  cours: Cours,
  screenId: string,
): readonly number[] {
  return cours.ecrans.flatMap((ecran, rang) =>
    ecranCorrigePar(ecran) === screenId ? [rang] : [],
  );
}

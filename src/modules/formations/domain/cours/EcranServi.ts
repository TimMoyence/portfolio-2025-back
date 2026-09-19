import type { Cours, Ecran } from '../contrats/cours';
import { EcranNonServiError } from '../errors/FormationErrors';
import type { FreeRange, PacingMode } from '../PacingMode';
import type { SessionState } from '../SessionState';

export interface DiffusionDeSeance {
  readonly etat: SessionState;
  readonly modeRythme: PacingMode;
  readonly ecranCourant: number;
  readonly intervalleLibre: FreeRange | null;
}

export function dernierEcranServi(
  seance: DiffusionDeSeance,
  total: number,
): number {
  if (seance.etat === 'terminee') {
    return total - 1;
  }
  if (seance.modeRythme === 'libre') {
    return seance.intervalleLibre === null
      ? total - 1
      : seance.intervalleLibre.dernier;
  }
  return seance.ecranCourant;
}

export function assertEcranServi(
  seance: DiffusionDeSeance,
  rang: number,
  screenId: string,
  total: number = Number.MAX_SAFE_INTEGER,
): void {
  if (rang < 0 || rang > dernierEcranServi(seance, total)) {
    throw new EcranNonServiError(screenId);
  }
}

export function rangDeLEcran(cours: Cours, screenId: string): number {
  return cours.ecrans.findIndex((ecran) => ecran.id === screenId);
}

function activitesDeLEcran(ecran: Ecran): readonly string[] {
  switch (ecran.brique) {
    case 'fp-worked':
      return ecran.proprietes.exemple.etapes.map(
        (etape) => `${ecran.proprietes.exemple.id}:${etape.id}`,
      );
    case 'fp-recall':
      return [`${ecran.question.id}:rappel`];
    case 'fp-exit':
      return [ecran.question.id];
    case 'fp-story':
      return reflexionDuRecit(ecran);
    default:
      return [];
  }
}

function reflexionDuRecit(
  ecran: Extract<Ecran, { readonly brique: 'fp-story' }>,
): readonly string[] {
  const presentation = ecran.proprietes.presentation;
  if (presentation?.version !== 2 || presentation.renderer !== 'reflection') {
    return [];
  }
  return [presentation.props.promptData.id];
}

export function activitesLibres(
  cours: Cours,
): ReadonlyMap<string, readonly string[]> {
  const admises = new Map<string, readonly string[]>();
  for (const ecran of cours.ecrans) {
    const activites = activitesDeLEcran(ecran);
    if (activites.length > 0) {
      admises.set(ecran.id, activites);
    }
  }
  return admises;
}

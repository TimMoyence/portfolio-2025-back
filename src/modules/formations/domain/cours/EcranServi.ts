import type { Cours, Ecran } from '../contrats/cours';
import { questionsDe } from './Cours';
import type { PilotageEcran } from '../contrats/pilotage';
import {
  EcranNonServiError,
  PhaseFermeeError,
} from '../errors/FormationErrors';
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

function corrigeLEcran(ecran: Ecran, screenId: string): boolean {
  if (ecran.brique !== 'fp-story') {
    return false;
  }
  const presentation = ecran.proprietes.presentation;
  return (
    presentation?.version === 2 &&
    presentation.renderer === 'sort-review' &&
    presentation.props.source.screenId === screenId
  );
}

export function assertCorrectionNonProjetee(
  seance: DiffusionDeSeance & {
    readonly pilotageEcrans: Readonly<Record<string, PilotageEcran>>;
  },
  cours: Cours,
  screenId: string,
): void {
  const correction = cours.ecrans.findIndex((ecran) =>
    corrigeLEcran(ecran, screenId),
  );
  const correctionAtteinte =
    seance.modeRythme === 'pilote' &&
    correction >= 0 &&
    correction <= seance.ecranCourant;
  if (
    correctionAtteinte ||
    (seance.pilotageEcrans[screenId]?.etayage ?? 0) > 0
  ) {
    throw new PhaseFermeeError(screenId);
  }
}

export function rangDeLEcran(cours: Cours, screenId: string): number {
  return cours.ecrans.findIndex((ecran) => ecran.id === screenId);
}

export function rangDeLaQuestion(cours: Cours, questionId: string): number {
  return cours.ecrans.findIndex((ecran) =>
    questionsDe(ecran).some((question) => question.id === questionId),
  );
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
    case 'fp-pro':
      return (ecran.proprietes.questionsLibres ?? []).map(({ id }) => id);
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

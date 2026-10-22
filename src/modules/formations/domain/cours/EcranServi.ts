import type { QuestionDeBareme } from '../Bareme';
import type { Cours, Ecran } from '../contrats/cours';
import type { GradingResult } from '../GradingCore';
import { libelleLisible } from './banque/confusions';
import { correctionsDe, ecranCorrigePar } from './Corrections';
import { REGLE_DE_NOTATION } from '../RegleDeNotation';
import { estReservee, questionsDe } from './Cours';
import type { PieceJointeReservee } from './Cours';
import { ecranDeProduction } from './ProductionSoumise';
import type { PilotageEcran, VotePhase } from '../contrats/pilotage';
import {
  EcranNonServiError,
  PhaseFermeeError,
  PieceJointeIntrouvableError,
  PieceJointeRetenueError,
  TypeDeQuestionError,
} from '../errors/FormationErrors';
import type { FreeRange, PacingMode } from '../PacingMode';
import type { SessionState } from '../SessionState';

export interface DiffusionDeSeance {
  readonly etat: SessionState;
  readonly modeRythme: PacingMode;
  readonly ecranCourant: number;
  readonly intervalleLibre: FreeRange | null;
}

export type SeancePilotee = DiffusionDeSeance & {
  readonly pilotageEcrans: Readonly<Record<string, PilotageEcran>>;
};

export function ecranRevele(pilotage: PilotageEcran | undefined): boolean {
  return pilotage?.revele === true;
}

export function pilotageServi(
  seance: Pick<SeancePilotee, 'etat' | 'pilotageEcrans'>,
  screenId: string,
): PilotageEcran | undefined {
  const pilotage = seance.pilotageEcrans[screenId];
  return seance.etat === 'terminee' ? { ...pilotage, revele: true } : pilotage;
}

export function sourceRevelee(
  seance: Pick<SeancePilotee, 'etat' | 'pilotageEcrans'>,
  source: string,
): boolean {
  return ecranRevele(pilotageServi(seance, source));
}

export function phaseDuVote(pilotage: PilotageEcran | undefined): VotePhase {
  return pilotage?.phase ?? 'vote';
}

export interface VerdictServi {
  readonly correcte: boolean | null;
  readonly misconception: string | null;
  readonly libelleConfusion: string | null;
}

const VERDICT_RETENU: VerdictServi = {
  correcte: null,
  misconception: null,
  libelleConfusion: null,
};

function verdictRevele(
  seance: Pick<SeancePilotee, 'etat' | 'pilotageEcrans'>,
  question: QuestionDeBareme | null,
): boolean {
  if (
    question === null ||
    !('ouverture' in question) ||
    question.ouverture === undefined
  ) {
    return true;
  }
  return ecranRevele(pilotageServi(seance, question.ecranId));
}

export function verdictServiDe(
  seance: Pick<SeancePilotee, 'etat' | 'pilotageEcrans'>,
  question: QuestionDeBareme | null,
  verdict: GradingResult,
): VerdictServi {
  if (!verdictRevele(seance, question)) {
    return VERDICT_RETENU;
  }
  return {
    correcte: verdict.correcte,
    misconception: verdict.misconception,
    libelleConfusion: libelleLisible(verdict.misconception),
  };
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

export function ecranServi(
  seance: DiffusionDeSeance,
  rang: number,
  total: number = Number.MAX_SAFE_INTEGER,
): boolean {
  return rang >= 0 && rang <= dernierEcranServi(seance, total);
}

export function assertEcranServi(
  seance: DiffusionDeSeance,
  rang: number,
  screenId: string,
  total: number = Number.MAX_SAFE_INTEGER,
): void {
  if (!ecranServi(seance, rang, total)) {
    throw new EcranNonServiError(screenId);
  }
}

export interface CibleDuCours<T> {
  readonly valeur: T | null;
  readonly id: string;
  readonly rang: (valeur: T) => number;
}

export function absenteDuCours(
  nature: string,
): (id: string) => TypeDeQuestionError {
  return (id) => new TypeDeQuestionError(id, `n’est pas ${nature} de ce cours`);
}

export function cibleServie<T>(
  seance: DiffusionDeSeance,
  cours: Cours,
  cible: CibleDuCours<T>,
  absente: (id: string) => Error,
): T {
  if (cible.valeur === null) {
    throw absente(cible.id);
  }
  const rang = cible.rang(cible.valeur);
  assertEcranServi(
    seance,
    rang,
    idDeLEcranAuRang(cours, rang, cible.id),
    cours.ecrans.length,
  );
  return cible.valeur;
}

export function idDeLEcranAuRang(
  cours: Cours,
  rang: number,
  repli: string,
): string {
  return cours.ecrans[rang]?.id ?? repli;
}

function planEtRang<P>(
  cours: Cours,
  planId: string,
  planDe: (ecran: Ecran) => P | null,
): { readonly plan: P; readonly rang: number } | null {
  const production = ecranDeProduction(cours, planId);
  if (production === null) {
    return null;
  }
  const plan = planDe(production.ecran);
  return plan === null ? null : { plan, rang: production.rang };
}

export function planServi<P>(
  seance: DiffusionDeSeance,
  cours: Cours,
  planId: string,
  planDe: (ecran: Ecran) => P | null,
  nature: string,
): P {
  return cibleServie(
    seance,
    cours,
    {
      valeur: planEtRang(cours, planId, planDe),
      id: planId,
      rang: ({ rang }) => rang,
    },
    absenteDuCours(nature),
  ).plan;
}

export function etayageAtteint(pilotage: PilotageEcran | undefined): number {
  return Math.max(pilotage?.etayageAtteint ?? 0, pilotage?.etayage ?? 0);
}

export function correctionProjetee(
  seance: SeancePilotee,
  cours: Cours,
  screenId: string,
): boolean {
  const correctionAtteinte =
    seance.modeRythme === 'pilote' &&
    correctionsDe(cours, screenId).some((rang) => rang <= seance.ecranCourant);
  const pilotage = seance.pilotageEcrans[screenId];
  const corrigeParEtapes = cours.ecrans.some(
    (ecran) => ecran.id === screenId && ecran.brique === 'fp-worked',
  );
  return (
    correctionAtteinte ||
    ecranRevele(pilotage) ||
    (!corrigeParEtapes && etayageAtteint(pilotage) > 0)
  );
}

export function assertCorrectionNonProjetee(
  seance: SeancePilotee,
  cours: Cours,
  screenId: string,
): void {
  if (correctionProjetee(seance, cours, screenId)) {
    throw new PhaseFermeeError(screenId);
  }
}

export function pieceJointeServieAuPoste(
  seance: SeancePilotee,
  cours: Cours,
  screenId: string,
): PieceJointeReservee {
  const ecran = cibleServie(
    seance,
    cours,
    {
      valeur: ecranParId(cours, screenId) ?? null,
      id: screenId,
      rang: (servi) => cours.ecrans.indexOf(servi),
    },
    (id) => new PieceJointeIntrouvableError(id),
  );
  const revele = (source: string): boolean => sourceRevelee(seance, source);
  const source = ecranCorrigePar(ecran);
  if (source !== null && !revele(source)) {
    throw new EcranNonServiError(screenId);
  }
  const { pieceJointe } = ecran;
  if (pieceJointe === undefined || !estReservee(pieceJointe)) {
    throw new PieceJointeIntrouvableError(screenId);
  }
  if (!pieceJointe.reprend.every(revele)) {
    throw new PieceJointeRetenueError(screenId);
  }
  return pieceJointe;
}

export function ecranParId(cours: Cours, screenId: string): Ecran | undefined {
  return cours.ecrans.find((ecran) => ecran.id === screenId);
}

export function rangDeLEcran(cours: Cours, screenId: string): number {
  return cours.ecrans.findIndex((ecran) => ecran.id === screenId);
}

export function seuilDe(ecran: Ecran): number | null {
  if (questionsDe(ecran).length === 0) {
    return null;
  }
  return (
    ('seuil' in ecran ? ecran.seuil : undefined) ??
    REGLE_DE_NOTATION.seuilQuestionProbleme
  );
}

export function rangDeLaQuestion(cours: Cours, questionId: string): number {
  return cours.ecrans.findIndex((ecran) =>
    questionsDe(ecran).some((question) => question.id === questionId),
  );
}

export function activitesDeLEcran(ecran: Ecran): readonly string[] {
  switch (ecran.brique) {
    case 'fp-worked':
      if (ecran.proprietes.pilote === true) {
        return [];
      }
      return ecran.proprietes.exemple.etapes.map(
        (etape) => `${ecran.proprietes.exemple.id}:${etape.id}`,
      );
    case 'fp-recall':
      return ecran.delaiMs > 0 ? [`${ecran.question.id}:rappel`] : [];
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

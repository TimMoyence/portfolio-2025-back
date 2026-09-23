import type { Ecran } from '../contrats/cours';
import type { PilotageEcran, VotePhase } from '../contrats/pilotage';
import { PHASES_DE_VOTE } from '../contrats/pilotage';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import { questionsDe } from './Cours';

export type PilotageDemande = { readonly screenId: string } & PilotageEcran;

export interface QuestionPilotee {
  readonly ecranId: string;
  readonly ouverture?: 'principale' | 'jumelle';
}

const CORRECTIONS_DE_LA_FEUILLE = ['formules', 'valeurs'] as const;

function etapesDeLEcran(ecran: Ecran): number | null {
  if (ecran.brique === 'fp-sheet') {
    return CORRECTIONS_DE_LA_FEUILLE.length;
  }
  return ecran.brique === 'fp-worked'
    ? ecran.proprietes.exemple.etapes.length
    : null;
}

function assertReglagesDeLaMachine(
  ecran: Ecran,
  reglages: Readonly<Record<string, number>>,
  refuser: (raison: string) => never,
): void {
  if (ecran.brique !== 'fp-concept4') {
    refuser('seule une machine porte des réglages');
    return;
  }
  for (const [cle, valeur] of Object.entries(reglages)) {
    const parametre = ecran.proprietes.parametres.find(
      (candidat) => candidat.cle === cle,
    );
    if (parametre === undefined) {
      refuser(`paramètre ${cle} absent de la machine`);
      return;
    }
    if (valeur < parametre.min || valeur > parametre.max) {
      refuser(`réglage ${cle} hors de [${parametre.min} ; ${parametre.max}]`);
    }
  }
}

export function assertPilotageCompatible(
  ecran: Ecran,
  demande: PilotageDemande,
): void {
  const refuser = (raison: string): never => {
    throw new PilotageIncompatibleError(demande.screenId, raison);
  };
  if (demande.phase !== undefined && ecran.brique !== 'fp-vote') {
    refuser('seul un vote à question jumelle porte des phases');
  }
  if (
    demande.phase !== undefined &&
    ecran.brique === 'fp-vote' &&
    ecran.questionJumelle === undefined
  ) {
    refuser('ce vote n’a pas de question jumelle');
  }
  if (
    demande.revele !== undefined &&
    ecran.brique !== 'fp-challenge' &&
    questionsDe(ecran).length === 0
  ) {
    refuser('seul un écran porteur d’un corrigé se révèle');
  }
  if (demande.reglages !== undefined) {
    assertReglagesDeLaMachine(ecran, demande.reglages, refuser);
  }
  if (demande.etayage === undefined) {
    return;
  }
  const etapes = etapesDeLEcran(ecran);
  if (etapes === null) {
    refuser('seuls un exemple travaillé et une feuille portent un étayage');
    return;
  }
  if (demande.etayage > etapes) {
    refuser(`étayage ${demande.etayage} au-delà des ${etapes} étapes`);
  }
}

function rangDePhase(phase: VotePhase | undefined): number {
  return phase === undefined ? 0 : PHASES_DE_VOTE.indexOf(phase);
}

export function fusionnerPilotage(
  courant: Readonly<Record<string, PilotageEcran>>,
  demande: PilotageDemande,
): Readonly<Record<string, PilotageEcran>> {
  const { screenId, ...changements } = demande;
  const precedent: PilotageEcran = courant[screenId] ?? {};
  if (
    changements.phase !== undefined &&
    rangDePhase(changements.phase) < rangDePhase(precedent.phase)
  ) {
    throw new PhaseNonMonotoneError(screenId);
  }
  if (changements.revele === false && precedent.revele === true) {
    throw new PhaseNonMonotoneError(screenId);
  }
  return { ...courant, [screenId]: { ...precedent, ...changements } };
}

export function assertPhaseOuverte(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  question: QuestionPilotee,
): void {
  if (pilotage[question.ecranId]?.revele === true) {
    throw new PhaseFermeeError(question.ecranId);
  }
  if (question.ouverture === undefined) {
    if (pilotage[question.ecranId]?.revele === true) {
      throw new PhaseFermeeError(question.ecranId);
    }
    return;
  }
  const phase = pilotage[question.ecranId]?.phase ?? 'vote';
  const ouverte =
    question.ouverture === 'principale'
      ? phase === 'vote'
      : phase === 'revote' || phase === 'revele';
  if (!ouverte) {
    throw new PhaseFermeeError(question.ecranId);
  }
}

export function assertEtapeNonCorrigee(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  ecran: Ecran | undefined,
  activiteId: string,
): void {
  if (ecran?.brique !== 'fp-worked') {
    return;
  }
  const exemple = ecran.proprietes.exemple;
  const rang = exemple.etapes.findIndex(
    (etape) => `${exemple.id}:${etape.id}` === activiteId,
  );
  if (rang >= 0 && rang < (pilotage[ecran.id]?.etayage ?? 0)) {
    throw new PhaseFermeeError(ecran.id);
  }
}

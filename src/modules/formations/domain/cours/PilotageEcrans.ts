import type { Ecran } from '../contrats/cours';
import type {
  PilotageDemande,
  PilotageEcran,
  VotePhase,
} from '../contrats/pilotage';
import { PHASES_DE_VOTE } from '../contrats/pilotage';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import { questionsDe } from './Cours';
import { activitesDeLEcran, etayageAtteint } from './EcranServi';

export type { PilotageDemande } from '../contrats/pilotage';

export interface QuestionPilotee {
  readonly ecranId: string;
  readonly ouverture?: 'principale' | 'jumelle';
}

const NIVEAUX_DE_CORRECTION_D_UNE_PRODUCTION = ['formules', 'valeurs'] as const;

function etapesDeLEcran(ecran: Ecran): number | null {
  switch (ecran.brique) {
    case 'fp-sheet':
    case 'fp-table-build':
      return NIVEAUX_DE_CORRECTION_D_UNE_PRODUCTION.length;
    case 'fp-worked':
      return ecran.proprietes.exemple.etapes.length;
    default:
      return null;
  }
}

function parametresReglables(
  ecran: Ecran,
): readonly { cle: string; min: number; max: number }[] | null {
  if (ecran.brique === 'fp-concept4' || ecran.brique === 'fp-plot') {
    return ecran.proprietes.parametres;
  }
  return null;
}

function assertReglagesDeLaMachine(
  ecran: Ecran,
  reglages: Readonly<Record<string, number>>,
  refuser: (raison: string) => never,
): void {
  const parametres = parametresReglables(ecran);
  if (parametres === null) {
    refuser('seuls une machine et un tracé portent des réglages');
    return;
  }
  for (const [cle, valeur] of Object.entries(reglages)) {
    const parametre = parametres.find((candidat) => candidat.cle === cle);
    if (parametre === undefined) {
      refuser(`paramètre ${cle} absent de l’écran`);
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
    questionsDe(ecran).length === 0 &&
    activitesDeLEcran(ecran).length === 0
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
    refuser(
      'seuls un exemple travaillé, une feuille et un tableau portent un étayage',
    );
    return;
  }
  if (demande.etayage > etapes) {
    refuser(`étayage ${demande.etayage} au-delà des ${etapes} étapes`);
  }
}

const CLES_NON_PILOTABLES: readonly string[] = ['screenId', 'etayageAtteint'];

function sansClesNonPilotables(
  pilotage: PilotageEcran | PilotageDemande,
): Omit<PilotageEcran, 'etayageAtteint'> {
  return Object.fromEntries(
    Object.entries(pilotage).filter(
      ([cle]) => !CLES_NON_PILOTABLES.includes(cle),
    ),
  );
}

function rangDePhase(phase: VotePhase | undefined): number {
  return phase === undefined ? 0 : PHASES_DE_VOTE.indexOf(phase);
}

export function fusionnerPilotage(
  courant: Readonly<Record<string, PilotageEcran>>,
  demande: PilotageDemande,
): Readonly<Record<string, PilotageEcran>> {
  const { screenId } = demande;
  const changements = sansClesNonPilotables(demande);
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
  const suivant = sansClesNonPilotables({ ...precedent, ...changements });
  const atteint = Math.max(etayageAtteint(precedent), suivant.etayage ?? 0);
  return {
    ...courant,
    [screenId]:
      atteint > (suivant.etayage ?? 0)
        ? { ...suivant, etayageAtteint: atteint }
        : suivant,
  };
}

export function assertPhaseOuverte(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  question: QuestionPilotee,
): void {
  if (pilotage[question.ecranId]?.revele === true) {
    throw new PhaseFermeeError(question.ecranId);
  }
  if (question.ouverture === undefined) {
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
  if (rang >= 0 && rang < etayageAtteint(pilotage[ecran.id])) {
    throw new PhaseFermeeError(ecran.id);
  }
}

import type { Cours, Ecran } from '../contrats/cours';
import type {
  PilotageDemande,
  PilotageEcran,
  PilotageServi,
  VotePhase,
} from '../contrats/pilotage';
import { PHASES_DE_VOTE } from '../contrats/pilotage';
import {
  PhaseFermeeError,
  PhaseNonMonotoneError,
  PilotageIncompatibleError,
} from '../errors/FormationErrors';
import {
  correctionsRevelables,
  demandeDeCorrection,
} from './CorrectionSurPlace';
import { questionsDe } from './Cours';
import {
  activitesDeLEcran,
  correctionProjetee,
  ecranRevele,
  ecranServi,
  etayageAtteint,
  phaseDuVote,
} from './EcranServi';
import type { SeancePilotee } from './EcranServi';
import { refusDuReglage, sortiesDeLaMachine } from './MachineServie';
import { reglageServi } from './TraceServi';

export type { PilotageDemande } from '../contrats/pilotage';

export interface QuestionPilotee {
  readonly ecranId: string;
  readonly ouverture?: 'principale' | 'jumelle';
}

const NIVEAUX_DE_CORRECTION_D_UNE_FEUILLE = ['formules', 'valeurs'] as const;

function etapesDeLEcran(ecran: Ecran): number | null {
  switch (ecran.brique) {
    case 'fp-sheet':
      return NIVEAUX_DE_CORRECTION_D_UNE_FEUILLE.length;
    case 'fp-table-build':
      return ecran.proprietes.plan.colonnes.filter(
        ({ role }) => role !== 'donnee',
      ).length;
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
  }
  for (const [cle, valeur] of Object.entries(reglages)) {
    const refus = refusDuReglage(parametres, cle, valeur);
    if (refus !== null) {
      refuser(refus);
    }
    if (
      ecran.brique === 'fp-plot' &&
      !reglageServi(ecran.proprietes, cle, valeur)
    ) {
      refuser(`réglage ${cle} hors des positions servies du tracé`);
    }
  }
}

function assertCorrectionsRevelables(
  ecran: Ecran,
  demandees: number,
  refuser: (raison: string) => never,
): void {
  const revelables = correctionsRevelables(ecran);
  if (revelables === null) {
    refuser('seul un exercice corrigé sur place révèle ses corrections');
  }
  if (demandees > revelables) {
    refuser(`${demandees} corrections au-delà des ${revelables} explications`);
  }
}

export function assertPilotageCompatible(
  ecran: Ecran,
  demande: PilotageDemande,
): void {
  const refuser = (raison: string): never => {
    throw new PilotageIncompatibleError(demande.screenId, raison);
  };
  if (demande.phase !== undefined && !estVoteJumele(ecran)) {
    refuser(
      ecran.brique === 'fp-vote'
        ? 'ce vote n’a pas de question jumelle'
        : 'seul un vote à question jumelle porte des phases',
    );
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
  if (demande.optionsAffichees !== undefined && ecran.brique !== 'fp-recall') {
    refuser('seul un rappel diffère l affichage de ses options');
  }
  if (demande.explicationsDevoilees !== undefined) {
    assertCorrectionsRevelables(ecran, demande.explicationsDevoilees, refuser);
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
      ([cle, valeur]) =>
        valeur !== undefined && !CLES_NON_PILOTABLES.includes(cle),
    ),
  );
}

export function demandeAppliquee(
  ecran: Ecran,
  demande: PilotageDemande,
): PilotageDemande {
  const complete = demandeDeCorrection(ecran, demande);
  const revele = complete.revele === true || complete.phase === 'revele';
  return estVoteJumele(ecran) && revele
    ? { ...complete, phase: 'revele', revele: true }
    : complete;
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
    PHASES_DE_VOTE.indexOf(changements.phase) <
      PHASES_DE_VOTE.indexOf(phaseDuVote(precedent))
  ) {
    throw new PhaseNonMonotoneError(screenId);
  }
  if (
    (changements.revele === false && ecranRevele(precedent)) ||
    (changements.optionsAffichees === false &&
      precedent.optionsAffichees === true) ||
    (changements.explicationsDevoilees ?? Infinity) <
      (precedent.explicationsDevoilees ?? 0)
  ) {
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

type CoteDuVote = NonNullable<QuestionPilotee['ouverture']>;

function coteAffiche(pilotage: PilotageEcran | undefined): CoteDuVote {
  const phase = phaseDuVote(pilotage);
  return phase === 'revote' || phase === 'revele' ? 'jumelle' : 'principale';
}

const PHASES_FERMEES: readonly VotePhase[] = ['discussion', 'revele'];

function coteOuvert(pilotage: PilotageEcran | undefined): CoteDuVote | null {
  if (ecranRevele(pilotage) || PHASES_FERMEES.includes(phaseDuVote(pilotage))) {
    return null;
  }
  return coteAffiche(pilotage);
}

export function assertPhaseOuverte(
  pilotage: Readonly<Record<string, PilotageEcran>>,
  question: QuestionPilotee,
): void {
  if (ecranRevele(pilotage[question.ecranId])) {
    throw new PhaseFermeeError(question.ecranId);
  }
  if (
    question.ouverture !== undefined &&
    coteOuvert(pilotage[question.ecranId]) !== question.ouverture
  ) {
    throw new PhaseFermeeError(question.ecranId);
  }
}

type Vote = Extract<Ecran, { brique: 'fp-vote' }>;

export function estVoteJumele(
  ecran: Ecran,
): ecran is Vote & Required<Pick<Vote, 'questionJumelle'>> {
  return ecran.brique === 'fp-vote' && ecran.questionJumelle !== undefined;
}

function enDirectDe(
  ecran: Ecran,
  pilotage: PilotageEcran | undefined,
): PilotageServi | undefined {
  if (estVoteJumele(ecran)) {
    const questions: Record<CoteDuVote, string> = {
      principale: ecran.question.id,
      jumelle: ecran.questionJumelle.id,
    };
    const ouvert = coteOuvert(pilotage);
    return {
      ...pilotage,
      phase: phaseDuVote(pilotage),
      questionAffichee: questions[coteAffiche(pilotage)],
      questionOuverte: ouvert === null ? null : questions[ouvert],
    };
  }
  if (ecran.brique === 'fp-concept4' && pilotage?.reglages !== undefined) {
    return {
      ...pilotage,
      sortiesProjetees: sortiesDeLaMachine(ecran.proprietes, pilotage.reglages),
    };
  }
  return pilotage;
}

export function pilotageEnDirect(
  seance: SeancePilotee,
  cours: Cours,
): Readonly<Record<string, PilotageServi>> {
  const pilotage = seance.pilotageEcrans;
  return cours.ecrans.reduce<Readonly<Record<string, PilotageServi>>>(
    (servi, ecran, rang) => {
      if (!ecranServi(seance, rang, cours.ecrans.length)) {
        return servi;
      }
      const pose = correctionProjetee(seance, cours, ecran.id)
        ? { ...pilotage[ecran.id], correctionProjetee: true as const }
        : pilotage[ecran.id];
      const enDirect = enDirectDe(ecran, pose);
      return enDirect === undefined || enDirect === pilotage[ecran.id]
        ? servi
        : { ...servi, [ecran.id]: enDirect };
    },
    pilotage,
  );
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

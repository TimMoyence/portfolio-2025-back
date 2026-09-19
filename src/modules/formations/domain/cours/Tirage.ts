import { matchesSolution } from '../GradingCore';
import type { AnswerValue, Solution, Tolerance } from '../GradingCore';
import { creerRng, creerTirage, melanger } from './Aleatoire';
import type { Rng, Tirage } from './Aleatoire';
import { estBriqueQuestion, estInteractif } from './Cours';
import type {
  BriqueExposition,
  BriqueQuestion,
  Cours,
  Ecran,
  EcranQuestion,
  EcranQuestionnaire,
  Modalite,
  Question,
  QuestionNumerique,
  QuestionVote,
  QuestionVoteTiree,
  RegimeVerrou,
} from './Cours';
import type { CoursPublic, EcranPublic } from './CoursPublic';
import type { ConfusionId } from './banque/confusions';

const PROPRIETES_RESERVEES_AU_FORMATEUR: readonly string[] = [
  'guide',
  'correction',
  'interaction',
];

export class TirageAmbiguError extends Error {
  readonly questionId: string;
  readonly graine: number;

  constructor(questionId: string, graine: number) {
    super(
      `Tirage ambigu pour la question ${questionId} avec la graine ${graine}`,
    );
    this.name = 'TirageAmbiguError';
    this.questionId = questionId;
    this.graine = graine;
  }
}

export interface CorrigeTire {
  readonly bonneReponse: string;
  readonly confusions: readonly ConfusionId[];
}

export type LibellesDesOptions = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

export interface TirageDuCours {
  readonly sujet: CoursPublic;
  readonly solutions: Readonly<Record<string, Solution>>;
  readonly corriges: Readonly<Record<string, CorrigeTire>>;
  readonly libellesOptions: LibellesDesOptions;
}

export const PROPRIETE_PAR_BRIQUE: Readonly<
  Record<BriqueExposition | BriqueQuestion, string>
> = {
  'fp-quote': 'citation',
  'fp-story': 'recit',
  'fp-pro': 'cas',
  'fp-worked': 'exemple',
  'fp-concept4': 'definition',
  'fp-plot': 'definition',
  'fp-challenge': 'probleme',
  'fp-cardsort': 'plan',
  'fp-numeric': 'question',
  'fp-vote': 'question',
  'fp-recall': 'question',
  'fp-exit': 'billet',
};

interface Metadonnees {
  readonly concepts: readonly string[];
  readonly misconceptionsCiblees: readonly string[];
  readonly dureeMinutes: number;
  readonly modalite: Modalite;
  readonly regime: RegimeVerrou;
}

interface OptionPublique {
  readonly id: string;
  readonly libelle: string;
}

interface VotePublic {
  readonly id: string;
  readonly enonce: string;
  readonly options: readonly OptionPublique[];
}

interface NumeriquePublic {
  readonly id: string;
  readonly enonce: string;
  readonly unite: string | null;
  readonly metadonnees: Metadonnees;
}

interface BilletPublic {
  readonly id: string;
  readonly question: string;
  readonly invite: string;
  readonly options: readonly OptionPublique[];
  readonly metadonnees: Metadonnees;
}

type Donnees = Readonly<Record<string, unknown>>;

interface QuestionProjetee {
  readonly brique: 'fp-numeric' | 'fp-vote';
  readonly donnees: Donnees;
}

interface Contexte {
  readonly graine: number;
  readonly rng: Rng;
  readonly tirage: Tirage;
  readonly solutions: [string, Solution][];
  readonly corriges: [string, CorrigeTire][];
  readonly libellesOptions: [string, Readonly<Record<string, string>>][];
}

export function tirer(cours: Cours, graine: number): TirageDuCours {
  const rng = creerRng(graine);
  const contexte: Contexte = {
    graine,
    rng,
    tirage: creerTirage(rng),
    solutions: [],
    corriges: [],
    libellesOptions: [],
  };
  const ecrans = cours.ecrans.map((ecran) => projeterEcran(ecran, contexte));
  return {
    sujet: {
      id: cours.slug,
      titre: cours.titre,
      niveau: cours.niveau,
      duree: cours.dureeMinutes,
      concepts: [...cours.concepts],
      ecrans,
    },
    solutions: Object.fromEntries(contexte.solutions),
    corriges: Object.fromEntries(contexte.corriges),
    libellesOptions: Object.fromEntries(contexte.libellesOptions),
  };
}

function projeterEcran(ecran: Ecran, contexte: Contexte): EcranPublic {
  if (ecran.question !== undefined && !estBriqueQuestion(ecran.brique)) {
    enregistrerQuestionAttachee(ecran.question, contexte);
  }
  return {
    id: ecran.id,
    type: ecran.brique,
    duree: ecran.dureeMinutes,
    interactif: estInteractif(ecran),
    donnees: donneesDe(ecran, contexte),
  };
}

function enregistrerQuestionAttachee(
  question: Question,
  contexte: Contexte,
): void {
  if (question.type === 'numeric') {
    const tiree = question.generer(contexte.tirage);
    assurerNonAmbigu(
      question,
      [tiree.solution, ...tiree.pieges.map((piege) => piege.valeur)],
      contexte.graine,
    );
    contexte.solutions.push([
      question.id,
      {
        valeur: tiree.solution,
        pieges: tiree.pieges.map((piege) => ({
          valeur: piege.valeur,
          misconception: piege.confusion,
        })),
      },
    ]);
    contexte.corriges.push([
      question.id,
      corrige(String(Number(tiree.solution.toFixed(6))), tiree.pieges),
    ]);
    return;
  }

  const tiree = question.generer(contexte.tirage);
  contexte.solutions.push([
    question.id,
    {
      valeur: tiree.bonne,
      pieges: tiree.pieges.map((piege) => ({
        valeur: piege.optionId ?? piege.libelle,
        misconception: piege.confusion,
      })),
    },
  ]);
  contexte.corriges.push([question.id, corrige(tiree.bonne, tiree.pieges)]);
  const libelles: Record<string, string> = {
    [tiree.bonne]: tiree.bonneLibelle ?? tiree.bonne,
  };
  for (const piege of tiree.pieges) {
    libelles[piege.optionId ?? piege.libelle] = piege.libelle;
  }
  contexte.libellesOptions.push([question.id, libelles]);
}

function donneesDe(ecran: Ecran, contexte: Contexte): Donnees {
  switch (ecran.brique) {
    case 'questionnaire':
      return tirerQuestionnaire(ecran, contexte);
    case 'fp-numeric':
    case 'fp-vote':
      return projeterQuestion(ecran.question, metadonnees(ecran), contexte)
        .donnees;
    case 'fp-recall':
      return sousPropriete(ecran.brique, {
        ...tirerVote(ecran.question, contexte),
        metadonnees: metadonnees(ecran),
      });
    case 'fp-exit':
      return sousPropriete(ecran.brique, billet(ecran, contexte));
    default:
      return sousPropriete(ecran.brique, {
        id: ecran.id,
        ...proprietesPubliques(ecran.proprietes),
        metadonnees: metadonnees(ecran),
      });
  }
}

function proprietesPubliques(
  proprietes: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(proprietes).filter(
      ([cle]) => !PROPRIETES_RESERVEES_AU_FORMATEUR.includes(cle),
    ),
  );
}

function sousPropriete(
  brique: BriqueExposition | BriqueQuestion,
  contenu: object,
): Donnees {
  return { [PROPRIETE_PAR_BRIQUE[brique]]: contenu };
}

function metadonnees(ecran: Ecran): Metadonnees {
  return {
    concepts: [...ecran.concepts],
    misconceptionsCiblees: [],
    dureeMinutes: ecran.dureeMinutes,
    modalite: ecran.modalite ?? 'solo',
    regime: ecran.brique === 'questionnaire' ? ecran.regime : 'ouvert',
  };
}

function tirerQuestionnaire(
  ecran: EcranQuestionnaire,
  contexte: Contexte,
): Donnees {
  const communes = metadonnees(ecran);
  return {
    regime: ecran.regime,
    questions: melanger(ecran.questions, contexte.rng).map((question) =>
      projeterQuestion(question, communes, contexte),
    ),
  };
}

function projeterQuestion(
  question: Question,
  communes: Metadonnees,
  contexte: Contexte,
): QuestionProjetee {
  if (question.type === 'numeric') {
    return {
      brique: 'fp-numeric',
      donnees: sousPropriete(
        'fp-numeric',
        tirerNumerique(question, communes, contexte),
      ),
    };
  }
  return {
    brique: 'fp-vote',
    donnees: sousPropriete('fp-vote', tirerVote(question, contexte)),
  };
}

function billet(
  ecran: Extract<EcranQuestion, { readonly brique: 'fp-exit' }>,
  contexte: Contexte,
): BilletPublic {
  const vote = tirerVote(ecran.question, contexte);
  return {
    id: vote.id,
    question: vote.enonce,
    invite: ecran.invite,
    options: vote.options,
    metadonnees: metadonnees(ecran),
  };
}

function tirerNumerique(
  question: QuestionNumerique,
  communes: Metadonnees,
  contexte: Contexte,
): NumeriquePublic {
  const tiree = question.generer(contexte.tirage);
  assurerNonAmbigu(
    question,
    [tiree.solution, ...tiree.pieges.map((piege) => piege.valeur)],
    contexte.graine,
  );
  contexte.solutions.push([
    question.id,
    {
      valeur: tiree.solution,
      pieges: tiree.pieges.map((piege) => ({
        valeur: piege.valeur,
        misconception: piege.confusion,
      })),
    },
  ]);
  contexte.corriges.push([
    question.id,
    corrige(String(Number(tiree.solution.toFixed(6))), tiree.pieges),
  ]);
  return {
    id: question.id,
    enonce: tiree.enonce,
    unite: tiree.unite,
    metadonnees: communes,
  };
}

function tirerVote(question: QuestionVote, contexte: Contexte): VotePublic {
  const tiree = question.generer(contexte.tirage);
  const libelleDeLaBonne = tiree.bonneLibelle ?? tiree.bonne;
  assurerNonAmbigu(
    question,
    [libelleDeLaBonne, ...tiree.pieges.map((piege) => piege.libelle)].map(
      (libelle) => libelle.trim(),
    ),
    contexte.graine,
  );
  const { options, solution } = optionsMelangees(tiree, contexte.rng);
  contexte.solutions.push([question.id, solution]);
  contexte.corriges.push([
    question.id,
    corrige(libelleDeLaBonne, tiree.pieges),
  ]);
  contexte.libellesOptions.push([
    question.id,
    Object.fromEntries(options.map((option) => [option.id, option.libelle])),
  ]);
  return { id: question.id, enonce: tiree.enonce, options };
}

interface EntreeDeVote {
  readonly libelle: string;
  readonly idStable?: string;
}

function entreesDuVote(tiree: QuestionVoteTiree): {
  readonly bonne: EntreeDeVote;
  readonly pieges: readonly EntreeDeVote[];
} {
  return {
    bonne:
      tiree.bonneLibelle === undefined
        ? { libelle: tiree.bonne }
        : { libelle: tiree.bonneLibelle, idStable: tiree.bonne },
    pieges: tiree.pieges.map((piege) => ({
      libelle: piege.libelle,
      idStable: piege.optionId,
    })),
  };
}

function optionsMelangees(
  tiree: QuestionVoteTiree,
  rng: Rng,
): {
  readonly options: readonly OptionPublique[];
  readonly solution: Solution;
} {
  const { bonne, pieges } = entreesDuVote(tiree);
  const ordre = melanger([bonne, ...pieges], rng);
  const stables = ordre.every((entree) => entree.idStable !== undefined);
  const idDe = (entree: EntreeDeVote): string =>
    stables && entree.idStable !== undefined
      ? entree.idStable
      : `o${ordre.indexOf(entree) + 1}`;
  return {
    options: ordre.map((entree) => ({
      id: idDe(entree),
      libelle: entree.libelle,
    })),
    solution: {
      valeur: idDe(bonne),
      pieges: tiree.pieges.map((piege, rang) => ({
        valeur: idDe(pieges[rang]),
        misconception: piege.confusion,
      })),
    },
  };
}

function corrige(
  bonneReponse: string,
  pieges: readonly { readonly confusion: ConfusionId }[],
): CorrigeTire {
  return { bonneReponse, confusions: pieges.map((piege) => piege.confusion) };
}

function assurerNonAmbigu(
  question: Question,
  valeurs: readonly AnswerValue[],
  graine: number,
): void {
  const tolerance =
    question.type === 'numeric' ? question.tolerance : undefined;
  const ambigu = valeurs.some(
    (valeur, rang) =>
      !estFinie(valeur) ||
      valeurs
        .slice(rang + 1)
        .some((autre) => seConfondent(valeur, autre, tolerance)),
  );
  if (ambigu) {
    throw new TirageAmbiguError(question.id, graine);
  }
}

function estFinie(valeur: AnswerValue): boolean {
  return typeof valeur === 'string' || Number.isFinite(valeur);
}

function seConfondent(
  a: AnswerValue,
  b: AnswerValue,
  tolerance: Tolerance | undefined,
): boolean {
  return matchesSolution(a, b, tolerance) || matchesSolution(b, a, tolerance);
}

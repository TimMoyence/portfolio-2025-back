import { valeursAmbigues } from '../GradingCore';
import type { AnswerValue, Solution } from '../GradingCore';
import type { Cours, Ecran, Question } from '../contrats/cours';
import type {
  ExitBilletPublic,
  MetadonneesBrique,
  NumeriquePublic,
  OptionPublique,
  VotePublic,
} from '../contrats/donnees-publiques';
import type {
  CoursPublic,
  EcranPublic,
  TirageDuCours,
} from '../contrats/tirage';
import { creerRng, creerTirage, melanger } from './Aleatoire';
import { creerCacheLRU } from './CacheLRU';
import type { Rng, Tirage } from './Aleatoire';
import type { ConfusionId } from './banque/confusions';
import { ecranCorrigePar, ecransCorrigeantDe } from './Corrections';
import { estInteractif } from './Cours';
import type {
  AuMoinsUn,
  QuestionNumerique,
  QuestionVote,
  QuestionVoteTiree,
} from './Cours';

export type { TirageDuCours } from '../contrats/tirage';

const PROPRIETES_RESERVEES_AU_FORMATEUR: readonly string[] = [
  'guide',
  'correction',
  'interaction',
  'questions',
  'corrige',
  'banque',
];

const SEL_CARTES = 0x0ca7de5;
const SEL_BANQUE = 0x0ba9c3e;

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

type BriqueRuntime = Exclude<Ecran['brique'], 'questionnaire'>;

export const PROPRIETE_PAR_BRIQUE: Readonly<Record<BriqueRuntime, string>> = {
  'fp-quote': 'citation',
  'fp-story': 'recit',
  'fp-pro': 'cas',
  'fp-worked': 'exemple',
  'fp-concept4': 'definition',
  'fp-plot': 'definition',
  'fp-pulse': 'sondage',
  'fp-challenge': 'probleme',
  'fp-cardsort': 'plan',
  'fp-sheet': 'plan',
  'fp-table-build': 'plan',
  'fp-escape': 'parcours',
  'fp-spaced': 'rappel',
  'fp-numeric': 'question',
  'fp-vote': 'question',
  'fp-recall': 'question',
  'fp-exit': 'billet',
};

type Donnees = Readonly<Record<string, unknown>>;

interface QuestionProjetee {
  readonly brique: 'fp-numeric' | 'fp-vote';
  readonly donnees: Donnees;
}

interface Contexte {
  readonly graine: number;
  readonly rng: Rng;
  readonly tirage: Tirage;
  readonly rngCartes: Rng;
  readonly rngBanque: Rng;
  readonly tirageBanque: Tirage;
  readonly solutions: [string, Solution][];
  readonly corriges: [string, CorrigeTire][];
  readonly libellesOptions: [string, Readonly<Record<string, string>>][];
  readonly banque: [string, VotePublic][];
  readonly enonces: [string, string][];
}

export interface TirageDetaille {
  readonly tirage: TirageDuCours;
  readonly enonces: Readonly<Record<string, string>>;
}

function contexteDe(graine: number): Contexte {
  const rng = creerRng(graine);
  const rngBanque = creerRng(graine ^ SEL_BANQUE);
  return {
    graine,
    rng,
    tirage: creerTirage(rng),
    rngCartes: creerRng(graine ^ SEL_CARTES),
    rngBanque,
    tirageBanque: creerTirage(rngBanque),
    solutions: [],
    corriges: [],
    libellesOptions: [],
    banque: [],
    enonces: [],
  };
}

export function tirerEnDetail(cours: Cours, graine: number): TirageDetaille {
  const contexte = contexteDe(graine);
  const ecrans = cours.ecrans.map((ecran) =>
    projeterEcran(ecran, ecransCorrigeantDe(cours, ecran.id), contexte),
  );
  const sujet: CoursPublic = {
    id: cours.slug,
    titre: cours.titre,
    niveau: cours.niveau,
    duree: cours.dureeMinutes,
    concepts: [...cours.concepts],
    ecrans,
  };
  return {
    tirage: {
      sujet,
      solutions: Object.fromEntries(contexte.solutions),
      corriges: Object.fromEntries(contexte.corriges),
      libellesOptions: Object.fromEntries(contexte.libellesOptions),
      banque: Object.fromEntries(contexte.banque),
    },
    enonces: Object.fromEntries(contexte.enonces),
  };
}

export const TAILLE_MEMO_TIRAGES = 64;

interface TirageMemorise {
  readonly cours: Cours;
  readonly tirage: TirageDuCours;
}

const memoDesTirages = creerCacheLRU<TirageMemorise>(TAILLE_MEMO_TIRAGES);

export function tirer(cours: Cours, graine: number): TirageDuCours {
  const cle = `${cours.slug}#${String(graine)}`;
  const memorise = memoDesTirages.lire(cle);
  if (memorise !== undefined && memorise.cours === cours) {
    return memorise.tirage;
  }
  const { tirage } = tirerEnDetail(cours, graine);
  memoDesTirages.ecrire(cle, { cours, tirage });
  return tirage;
}

function projeterEcran(
  ecran: Ecran,
  resoluPar: readonly string[],
  contexte: Contexte,
): EcranPublic {
  const attachee = questionAttachee(ecran);
  if (attachee !== undefined) {
    enregistrerQuestion(attachee, contexte);
  }
  const ecranCorrige = ecranCorrigePar(ecran);
  return {
    id: ecran.id,
    type: ecran.brique,
    titre: ecran.titre,
    duree: ecran.dureeMinutes,
    interactif: estInteractif(ecran),
    donnees: donneesDe(ecran, contexte),
    ...(ecran.renvoi === undefined ? {} : { renvoi: ecran.renvoi }),
    ...(ecran.cadrageDuRenvoi === undefined
      ? {}
      : { cadrageDuRenvoi: ecran.cadrageDuRenvoi }),
    ...(ecranCorrige === null ? {} : { ecranCorrige }),
    ...(resoluPar.length === 0 ? {} : { resoluPar: [...resoluPar] }),
  };
}

function questionAttachee(ecran: Ecran): QuestionVote | undefined {
  switch (ecran.brique) {
    case 'fp-numeric':
    case 'fp-vote':
    case 'fp-recall':
    case 'fp-exit':
      return undefined;
    default:
      return ecran.question;
  }
}

function enregistrerQuestion(question: Question, contexte: Contexte): void {
  switch (question.type) {
    case 'numeric':
      enregistrerNumerique(question, contexte);
      return;
    case 'vote':
      enregistrerVoteAttache(question, contexte);
      return;
    case 'feuille':
    case 'tableau':
    case 'classement':
    case 'enigme':
      return;
    default:
      return question satisfies never;
  }
}

function enregistrerNumerique(
  question: QuestionNumerique,
  contexte: Contexte,
): { readonly enonce: string; readonly unite: string | null } {
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
    corrige(
      question.formePubliee ?? String(Number(tiree.solution.toFixed(6))),
      tiree.pieges,
    ),
  ]);
  contexte.enonces.push([question.id, tiree.enonce]);
  return { enonce: tiree.enonce, unite: tiree.unite };
}

function enregistrerVoteAttache(
  question: QuestionVote,
  contexte: Contexte,
): void {
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
  contexte.enonces.push([question.id, tiree.enonce]);
}

function metadonnees(ecran: Ecran): MetadonneesBrique {
  return {
    concepts: [...ecran.concepts],
    misconceptionsCiblees: [],
    dureeMinutes: ecran.dureeMinutes,
    modalite: ecran.modalite ?? 'solo',
    regime: ecran.brique === 'questionnaire' ? ecran.regime : 'ouvert',
  };
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

function donneesDe(ecran: Ecran, contexte: Contexte): Donnees {
  switch (ecran.brique) {
    case 'questionnaire':
      return tirerQuestionnaire(ecran, contexte);
    case 'fp-numeric':
      return {
        question: tirerNumerique(ecran.question, metadonnees(ecran), contexte),
      };
    case 'fp-vote':
      return {
        question: tirerVote(ecran.question, contexte),
        ...(ecran.questionJumelle === undefined
          ? {}
          : { questionJumelle: tirerVote(ecran.questionJumelle, contexte) }),
      };
    case 'fp-recall':
      return {
        question: {
          ...tirerVote(ecran.question, contexte),
          metadonnees: metadonnees(ecran),
        },
        delaiMs: ecran.delaiMs,
        ...(ecran.consigne === undefined ? {} : { consigne: ecran.consigne }),
      };
    case 'fp-exit':
      return { billet: billet(ecran, contexte) };
    default:
      return donneesDeBrique(ecran, contexte);
  }
}

type EcranSansQuestionPropre = Exclude<
  Ecran,
  {
    readonly brique:
      | 'questionnaire'
      | 'fp-numeric'
      | 'fp-vote'
      | 'fp-recall'
      | 'fp-exit';
  }
>;

function donneesDeBrique(
  ecran: EcranSansQuestionPropre,
  contexte: Contexte,
): Donnees {
  const communes = metadonnees(ecran);
  switch (ecran.brique) {
    case 'fp-worked':
      return {
        exemple: { ...ecran.proprietes.exemple, metadonnees: communes },
        etayage: ecran.proprietes.etayage,
        ...(ecran.proprietes.pilote === true ? { pilote: true } : {}),
        ...(ecran.proprietes.corrigeDe === undefined
          ? {}
          : { corrigeDe: ecran.proprietes.corrigeDe }),
      };
    case 'fp-pulse':
      return {
        sondage: { ...ecran.proprietes.sondage, metadonnees: communes },
      };
    case 'fp-challenge':
      return {
        probleme: {
          ...ecran.proprietes.probleme,
          strategies: [],
          metadonnees: communes,
        },
      };
    case 'fp-cardsort':
      return {
        plan: {
          ...ecran.proprietes.plan,
          cartes: melanger(ecran.proprietes.plan.cartes, contexte.rngCartes),
          metadonnees: communes,
        },
      };
    case 'fp-sheet':
    case 'fp-table-build':
      return { plan: { ...ecran.proprietes.plan, metadonnees: communes } };
    case 'fp-escape':
      return {
        parcours: { ...ecran.proprietes.parcours, metadonnees: communes },
      };
    case 'fp-spaced':
      enregistrerBanque(ecran.banque, contexte);
      return { rappel: { ...ecran.proprietes.rappel, metadonnees: communes } };
    case 'fp-quote':
    case 'fp-story':
    case 'fp-pro':
    case 'fp-concept4':
    case 'fp-plot':
      return {
        [PROPRIETE_PAR_BRIQUE[ecran.brique]]: {
          id: ecran.id,
          ...proprietesPubliques(ecran.proprietes),
          metadonnees: communes,
        },
      };
    default:
      return ecran satisfies never;
  }
}

function enregistrerBanque(
  banque: AuMoinsUn<QuestionVote>,
  contexte: Contexte,
): void {
  for (const question of banque) {
    contexte.banque.push([
      question.id,
      tirerVote(question, contexte, contexte.rngBanque, contexte.tirageBanque),
    ]);
  }
}

function tirerQuestionnaire(
  ecran: Extract<Ecran, { readonly brique: 'questionnaire' }>,
  contexte: Contexte,
): Donnees {
  const communes = metadonnees(ecran);
  const questions =
    ecran.ordre === 'fixe'
      ? ecran.questions
      : melanger(ecran.questions, contexte.rng);
  return {
    intitule: ecran.intitule,
    consigne: ecran.consigne,
    regime: ecran.regime,
    ordre: ecran.ordre,
    questions: questions.map((question) =>
      projeterQuestion(question, communes, contexte),
    ),
  };
}

function projeterQuestion(
  question: QuestionNumerique | QuestionVote,
  communes: MetadonneesBrique,
  contexte: Contexte,
): QuestionProjetee {
  if (question.type === 'numeric') {
    return {
      brique: 'fp-numeric',
      donnees: { question: tirerNumerique(question, communes, contexte) },
    };
  }
  return {
    brique: 'fp-vote',
    donnees: { question: tirerVote(question, contexte) },
  };
}

function billet(
  ecran: Extract<Ecran, { readonly brique: 'fp-exit' }>,
  contexte: Contexte,
): ExitBilletPublic {
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
  communes: MetadonneesBrique,
  contexte: Contexte,
): NumeriquePublic {
  const { enonce, unite } = enregistrerNumerique(question, contexte);
  return { id: question.id, enonce, unite, metadonnees: communes };
}

function tirerVote(
  question: QuestionVote,
  contexte: Contexte,
  rng: Rng = contexte.rng,
  tirage: Tirage = contexte.tirage,
): VotePublic {
  const tiree = question.generer(tirage);
  const libelleDeLaBonne = tiree.bonneLibelle ?? tiree.bonne;
  assurerNonAmbigu(
    question,
    [libelleDeLaBonne, ...tiree.pieges.map((piege) => piege.libelle)].map(
      (libelle) => libelle.trim(),
    ),
    contexte.graine,
  );
  const { options, solution } = optionsMelangees(tiree, rng);
  contexte.solutions.push([question.id, solution]);
  contexte.corriges.push([
    question.id,
    corrige(libelleDeLaBonne, tiree.pieges),
  ]);
  contexte.libellesOptions.push([
    question.id,
    Object.fromEntries(options.map((option) => [option.id, option.libelle])),
  ]);
  contexte.enonces.push([question.id, tiree.enonce]);
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
  question: QuestionNumerique | QuestionVote,
  valeurs: readonly AnswerValue[],
  graine: number,
): void {
  const tolerance =
    question.type === 'numeric' ? question.tolerance : undefined;
  if (valeursAmbigues(valeurs, tolerance)) {
    throw new TirageAmbiguError(question.id, graine);
  }
}

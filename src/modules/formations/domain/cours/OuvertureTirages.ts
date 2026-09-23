import { randomInt } from 'node:crypto';
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import type { BaremeTirage } from '../Bareme';
import { solutionsIdentiques } from '../Bareme';
import type { BaremeQuestionV2, BaremeV2 } from '../contrats/bareme';
import type { Cours, Ecran, Question } from '../contrats/cours';
import type { Solution } from '../GradingCore';
import type { CorrigeProduction } from './Corrige';
import { questionsDe, questionsDuCours } from './Cours';
import { TirageAmbiguError, tirer } from './Tirage';

export const NOMBRE_TIRAGES_DISTRIBUES = 60;
const BORNE_GRAINE = 2_147_483_647;
const GRAINES_A_RETENIR = NOMBRE_TIRAGES_DISTRIBUES + 1;
const TENTATIVES_PAR_GRAINE = 10;

export type TireurDeGraine = (borne: number) => number;

export class TiragesInsuffisantsError extends ResourceConflictError {
  constructor(cours: Cours) {
    super(
      `Le cours ${cours.slug} ne produit pas ${GRAINES_A_RETENIR} tirages non ambigus : il ne peut pas être ouvert tant qu'il n'est pas corrigé.`,
    );
  }
}

function grainesValides(cours: Cours, tireur: TireurDeGraine): BaremeTirage[] {
  const dejaTirees = new Set<number>();
  const retenues: BaremeTirage[] = [];
  const maxAppels = GRAINES_A_RETENIR * TENTATIVES_PAR_GRAINE;
  for (
    let appel = 0;
    appel < maxAppels && retenues.length < GRAINES_A_RETENIR;
    appel += 1
  ) {
    const graine = tireur(BORNE_GRAINE);
    if (dejaTirees.has(graine)) {
      continue;
    }
    dejaTirees.add(graine);
    try {
      retenues.push({
        seed: graine,
        solutions: tirer(cours, graine).solutions,
      });
    } catch (erreur) {
      if (!(erreur instanceof TirageAmbiguError)) {
        throw erreur;
      }
    }
  }
  if (retenues.length < GRAINES_A_RETENIR) {
    throw new TiragesInsuffisantsError(cours);
  }
  return retenues;
}

export function ouvrirTirages(
  cours: Cours,
  tireur: TireurDeGraine = randomInt,
): BaremeV2 {
  const questions = questionsBaremeV2(cours);
  const corriges = corrigesDesProductions(cours);
  if (questions.length === 0) {
    return {
      version: 2,
      graineReference: 0,
      questions,
      solutionsCommunes: {},
      tirages: [],
      corriges,
    };
  }
  const graines = grainesValides(cours, tireur);
  const solutionsCommunes = solutionsCommunesA(graines);
  const [reference, ...tirages] = graines;
  return {
    version: 2,
    graineReference: reference.seed,
    questions,
    solutionsCommunes,
    tirages: tirages.map(({ seed, solutions }) => ({
      seed,
      ecarts: ecartsA(solutions, solutionsCommunes),
    })),
    corriges,
  };
}

function memeSolution(
  attendue: Solution,
  autre: Solution | undefined,
): boolean {
  return (
    autre !== undefined &&
    solutionsIdentiques({ solution: attendue }, { solution: autre })
  );
}

function solutionsCommunesA(
  graines: readonly BaremeTirage[],
): Readonly<Record<string, Solution>> {
  const [reference] = graines;
  return Object.fromEntries(
    Object.entries(reference.solutions).filter(([id, solution]) =>
      graines.every((graine) =>
        memeSolution(
          solution,
          Object.hasOwn(graine.solutions, id)
            ? graine.solutions[id]
            : undefined,
        ),
      ),
    ),
  );
}

function ecartsA(
  solutions: Readonly<Record<string, Solution>>,
  communes: Readonly<Record<string, Solution>>,
): Readonly<Record<string, Solution>> {
  return Object.fromEntries(
    Object.entries(solutions).filter(([id]) => !Object.hasOwn(communes, id)),
  );
}

function questionsBaremeV2(cours: Cours): readonly BaremeQuestionV2[] {
  return cours.ecrans.flatMap((ecran, rangEcran) =>
    questionsDe(ecran).map((question) => ({
      id: question.id,
      type: question.type,
      concept: question.concept,
      noteCompte: question.noteCompte,
      ecranId: ecran.id,
      rangEcran,
      ...particularitesDe(question, ecran),
    })),
  );
}

type Particularites = Pick<
  BaremeQuestionV2,
  'tolerance' | 'ouverture' | 'origine' | 'parcoursId' | 'rangEnigme'
>;

function particularitesDe(question: Question, ecran: Ecran): Particularites {
  if (question.type === 'numeric') {
    return { tolerance: question.tolerance };
  }
  if (question.type === 'enigme' && question.corrige.type === 'enigme') {
    return {
      parcoursId: question.corrige.parcoursId,
      rangEnigme: question.corrige.rang,
    };
  }
  if (ecran.brique === 'fp-spaced') {
    return { origine: 'banque' };
  }
  if (ecran.brique === 'fp-vote' && ecran.questionJumelle !== undefined) {
    return {
      ouverture: question.id === ecran.question.id ? 'principale' : 'jumelle',
    };
  }
  return {};
}

function corrigesDesProductions(
  cours: Cours,
): Readonly<Record<string, CorrigeProduction>> {
  return Object.fromEntries(
    questionsDuCours(cours).flatMap((question) =>
      question.type === 'vote' || question.type === 'numeric'
        ? []
        : [[question.id, question.corrige] as const],
    ),
  );
}

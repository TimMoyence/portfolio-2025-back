import { randomInt } from 'node:crypto';
import { ResourceConflictError } from '../../../../common/domain/errors/ResourceConflictError';
import type { Bareme, BaremeQuestion, BaremeTirage } from '../Bareme';
import type { Cours } from '../contrats/cours';
import { questionsDuCours } from './Cours';
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

export function ouvrirTirages(
  cours: Cours,
  tireur: TireurDeGraine = randomInt,
): Bareme {
  if (questionsDuCours(cours).length === 0) {
    return {
      version: 1,
      graineReference: 0,
      questions: [],
      tirages: [],
    };
  }
  const [reference, ...tirages] = grainesValides(cours, tireur);
  return {
    version: 1,
    graineReference: reference.seed,
    questions: questionsBareme(cours),
    tirages,
  };
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

function questionsBareme(cours: Cours): readonly BaremeQuestion[] {
  return questionsDuCours(cours).flatMap((question): BaremeQuestion[] => {
    switch (question.type) {
      case 'numeric':
        return [
          {
            id: question.id,
            type: question.type,
            concept: question.concept,
            noteCompte: question.noteCompte,
            tolerance: question.tolerance,
          },
        ];
      case 'vote':
        return [
          {
            id: question.id,
            type: question.type,
            concept: question.concept,
            noteCompte: question.noteCompte,
          },
        ];
      default:
        return [];
    }
  });
}

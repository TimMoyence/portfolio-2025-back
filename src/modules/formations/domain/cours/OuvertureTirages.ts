import { randomInt } from 'node:crypto';
import type { Bareme, BaremeQuestion, BaremeTirage } from '../Bareme';
import type { Cours } from './Cours';
import { questionsDuCours } from './Cours';
import { TirageAmbiguError, tirer } from './Tirage';

export const NOMBRE_TIRAGES_DISTRIBUES = 60;
export const BORNE_GRAINE = 2_147_483_647;
const GRAINES_A_RETENIR = NOMBRE_TIRAGES_DISTRIBUES + 1;
const TENTATIVES_PAR_GRAINE = 10;

export type TireurDeGraine = (borne: number) => number;

export class TiragesInsuffisantsError extends Error {
  constructor(cours: Cours) {
    super(
      `Impossible de tirer ${GRAINES_A_RETENIR} graines non ambigues pour le cours ${cours.slug}`,
    );
    this.name = 'TiragesInsuffisantsError';
  }
}

export function ouvrirTirages(
  cours: Cours,
  tireur: TireurDeGraine = randomInt,
): Bareme {
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
  return questionsDuCours(cours).map((question) =>
    question.type === 'numeric'
      ? {
          id: question.id,
          type: question.type,
          concept: question.concept,
          noteCompte: question.noteCompte,
          tolerance: question.tolerance,
        }
      : {
          id: question.id,
          type: question.type,
          concept: question.concept,
          noteCompte: question.noteCompte,
        },
  );
}

import type {
  Question,
  QuestionProduction,
} from '../../src/modules/formations/domain/contrats/cours';
import type { ValeurProduction } from '../../src/modules/formations/domain/contrats/resultats';
import type {
  AnswerValue,
  Solution,
  Tolerance,
} from '../../src/modules/formations/domain/GradingCore';

const DEMI = 2;
const FRACTION_DANS_L_ARRONDI = 0.4;

export function estProduction(
  question: Question,
): question is QuestionProduction {
  return (
    question.type === 'feuille' ||
    question.type === 'tableau' ||
    question.type === 'classement'
  );
}

export function productionJuste(
  question: QuestionProduction,
): ValeurProduction {
  const corrige = question.corrige;
  if (corrige.type === 'feuille') {
    return {
      type: 'feuille',
      cellules: Object.fromEntries(
        corrige.attendus.map((attendu) => [
          attendu.reference,
          attendu.formuleReference,
        ]),
      ),
    };
  }
  if (corrige.type === 'tableau') {
    return {
      type: 'tableau',
      saisies: corrige.attendus.map((attendu) => ({
        rang: attendu.rang,
        cle: attendu.cle,
        valeur: attendu.valeur,
      })),
    };
  }
  if (corrige.type === 'classement') {
    return {
      type: 'classement',
      classement: Object.fromEntries(
        corrige.attendus.map((attendu) => [
          attendu.carteId,
          attendu.categorieId,
        ]),
      ),
    };
  }
  throw new Error(`Question ${question.id} sans production jouable`);
}

export function reponseDEnigme(question: QuestionProduction): string {
  const corrige = question.corrige;
  if (corrige.type !== 'enigme') {
    throw new Error(`Question ${question.id} n est pas une enigme`);
  }
  return corrige.solution.type === 'nombre'
    ? corrige.solution.formePubliee
    : corrige.solution.acceptees[0];
}

export function dansLaTolerance(valeur: number, tolerance: Tolerance): number {
  switch (tolerance.type) {
    case 'absolue':
      return valeur + tolerance.valeur / DEMI;
    case 'relative':
      return valeur * (1 + tolerance.valeur / DEMI);
    case 'decimales': {
      const facteur = 10 ** tolerance.valeur;
      return (Math.round(valeur * facteur) + FRACTION_DANS_L_ARRONDI) / facteur;
    }
  }
}

export function bonneValeur(
  question: Question,
  solution: Solution,
): AnswerValue {
  return question.type === 'numeric' && typeof solution.valeur === 'number'
    ? dansLaTolerance(solution.valeur, question.tolerance)
    : solution.valeur;
}

export function valeurPiegee(
  question: Question,
  solution: Solution,
): { readonly valeur: AnswerValue; readonly confusion: string | null } {
  const piege = solution.pieges.at(0);
  return piege === undefined
    ? { valeur: bonneValeur(question, solution), confusion: null }
    : { valeur: piege.valeur, confusion: piege.misconception };
}

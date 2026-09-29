import type {
  Cours,
  Ecran,
  Question,
} from '../../src/modules/formations/domain/contrats/cours';
import {
  estInteractif,
  questionsDe,
  questionsDuCours,
} from '../../src/modules/formations/domain/cours/Cours';
import { tirer } from '../../src/modules/formations/domain/cours/Tirage';
import type { LigneDeVueDEnsemble } from './conception-de-cours';

const RANG_DU_NUMERO_D_ACTE = 'B2-01-A'.length;

export function renduDe(ecran: Ecran): string | null {
  if (ecran.brique !== 'fp-story') {
    return null;
  }
  const presentation = ecran.proprietes.presentation;
  return presentation?.version === 2 ? presentation.renderer : null;
}

export function ecransCorrigesSurPlace(cours: Cours): readonly string[] {
  return cours.ecrans
    .filter((ecran) => ecran.correctionSurPlace !== undefined)
    .map((ecran) => ecran.id);
}

export function estFermeeNotee(question: Question): boolean {
  return (
    question.noteCompte &&
    ['vote', 'numeric', 'classement'].includes(question.type)
  );
}

export function vueDuCours(cours: Cours): LigneDeVueDEnsemble[] {
  return cours.ecrans.map((ecran, rang) => ({
    rang: rang + 1,
    id: ecran.id,
    minutes: ecran.dureeMinutes,
    brique: ecran.brique,
    rendu: renduDe(ecran),
    interactif: estInteractif(ecran),
    questionsNotees: questionsDe(ecran).filter(estFermeeNotee).length,
    diffusion: ecran.diffusion,
  }));
}

export function acteDe(ecran: Ecran): number {
  return Number(ecran.id.charAt(RANG_DU_NUMERO_D_ACTE));
}

export function minutesParActe(cours: Cours): number[] {
  return [1, 2, 3, 4, 5, 6].map((acte) =>
    cours.ecrans
      .filter((ecran) => acteDe(ecran) === acte)
      .reduce((total, ecran) => total + ecran.dureeMinutes, 0),
  );
}

export function rythmeDuCours(cours: Cours): {
  readonly expositionContinueMax: number;
  readonly interactives: number;
  readonly exposition: number;
} {
  let bloc = 0;
  let expositionContinueMax = 0;
  for (const ecran of cours.ecrans) {
    bloc = estInteractif(ecran) ? 0 : bloc + ecran.dureeMinutes;
    expositionContinueMax = Math.max(expositionContinueMax, bloc);
  }
  const minutes = (interactif: boolean): number =>
    cours.ecrans
      .filter((ecran) => estInteractif(ecran) === interactif)
      .reduce((total, ecran) => total + ecran.dureeMinutes, 0);
  return {
    expositionContinueMax,
    interactives: minutes(true),
    exposition: minutes(false),
  };
}

export function ateliersNotes(cours: Cours): string[] {
  return cours.ecrans
    .slice(1, -1)
    .filter((ecran) => questionsDe(ecran).some(estFermeeNotee))
    .map((ecran) => `${ecran.id.slice(6, 11)} (${ecran.dureeMinutes})`);
}

export function arrondi(valeur: number, decimales = 6): number {
  return Number(valeur.toFixed(decimales));
}

function decimalesEcrites(valeur: number): number {
  const [, fraction = ''] = String(valeur).split('.');
  return fraction.length;
}

export function alignees(
  lues: readonly number[],
  calculees: readonly number[],
): number[] {
  return calculees.map((calculee, rang) =>
    rang < lues.length
      ? arrondi(calculee, decimalesEcrites(lues[rang]))
      : calculee,
  );
}

export function solutionsNumeriques(
  cours: Cours,
): Record<string, readonly number[]> {
  const { solutions } = tirer(cours, 0);
  return Object.fromEntries(
    questionsDuCours(cours)
      .filter((question) => question.type === 'numeric')
      .map((question) => {
        const { valeur, pieges } = solutions[question.id];
        return [
          question.id,
          [Number(valeur), ...pieges.map((piege) => Number(piege.valeur))],
        ];
      }),
  );
}

export function solutionsDesEnigmes(
  cours: Cours,
): Record<string, readonly number[]> {
  return Object.fromEntries(
    questionsDuCours(cours).flatMap((question) =>
      'corrige' in question &&
      question.corrige.type === 'enigme' &&
      question.corrige.solution.type === 'nombre'
        ? [
            [
              question.id,
              [
                question.corrige.solution.valeur,
                ...question.corrige.pieges.map((piege) => piege.valeur),
              ],
            ],
          ]
        : [],
    ),
  );
}

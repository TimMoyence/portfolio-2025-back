import { auMillionieme } from '../../../../../common/domain/nombres/arrondi';

export const BRANCHE_A_DEDUIRE = '?';

export type ProbabiliteDeBranche = number | typeof BRANCHE_A_DEDUIRE;

export interface BrancheSaisie {
  readonly evenement: string;
  readonly probabilite: ProbabiliteDeBranche;
  readonly branches?: readonly BrancheSaisie[];
}

export interface BrancheDeLArbre {
  readonly evenement: string;
  readonly probabilite: ProbabiliteDeBranche;
  readonly produit?: ProbabiliteDeBranche;
  readonly branches?: readonly BrancheDeLArbre[];
}

export function produitDuChemin(
  premiere: ProbabiliteDeBranche,
  seconde: ProbabiliteDeBranche,
): ProbabiliteDeBranche {
  return premiere === BRANCHE_A_DEDUIRE || seconde === BRANCHE_A_DEDUIRE
    ? BRANCHE_A_DEDUIRE
    : auMillionieme(premiere * seconde);
}

export function avecLesProduits(
  branches: readonly BrancheSaisie[],
): BrancheDeLArbre[] {
  return branches.map((branche) =>
    branche.branches === undefined
      ? branche
      : {
          ...branche,
          branches: branche.branches.map((feuille) => ({
            ...feuille,
            produit: produitDuChemin(branche.probabilite, feuille.probabilite),
          })),
        },
  );
}

import type { ConfusionId } from '../../domain/cours/banque/confusions';
import * as moteur from './briques';

type PiegeDeCellule = readonly [number, ConfusionId];
export type AttenduDeFeuille = ReturnType<typeof moteur.attendu>;

export function auMillionieme(valeur: number): number {
  return Number(valeur.toFixed(6));
}

export function avecVirgule(valeur: number, decimales: number): string {
  return valeur.toFixed(decimales).replace('.', ',');
}

export function termes<T>(
  suite: (rang: number) => T,
  premier: number,
  dernier: number,
): moteur.AuMoinsUn<T> {
  return [
    suite(premier),
    ...Array.from({ length: dernier - premier }, (_, ecart) =>
      suite(premier + 1 + ecart),
    ),
  ];
}

export const rangIdentique = (rang: number): number => rang;

export function anneesEtRangs(
  anneeDeDepart: number,
  dernierRang: number,
): Record<string, string> {
  return Object.fromEntries(
    termes(rangIdentique, 0, dernierRang).flatMap((rang) => [
      [`A${rang + 2}`, String(anneeDeDepart + rang)],
      [`B${rang + 2}`, String(rang)],
    ]),
  );
}

export function colonneDeValeurs(
  colonne: string,
  valeurs: readonly (number | string)[],
): Record<string, string> {
  return Object.fromEntries(
    valeurs.map((valeur, rang) => [`${colonne}${rang + 2}`, String(valeur)]),
  );
}

function recopiee(modele: string, decalage: number): string {
  return modele.replaceAll(
    /(?<![$A-Z])([A-H])(\d+)/g,
    (_, colonne: string, ligne: string) =>
      `${colonne}${Number(ligne) + decalage}`,
  );
}

export interface Recopie {
  readonly colonne: string;
  readonly premiereLigne: number;
  readonly formule: string;
  readonly piegesDuModele?: readonly PiegeDeCellule[];
  readonly piegesDeLaRecopie?: readonly PiegeDeCellule[];
  readonly confusionSiErreur?: ConfusionId;
  readonly tolerance?: AttenduDeFeuille['tolerance'];
}

export function colonneRecopiee(
  {
    colonne,
    premiereLigne,
    formule,
    piegesDuModele = [],
    piegesDeLaRecopie = [],
    confusionSiErreur,
    tolerance,
  }: Recopie,
  [premiere, ...suivantes]: moteur.AuMoinsUn<number | string>,
): moteur.AuMoinsUn<AttenduDeFeuille> {
  const modele = `${colonne}${premiereLigne}`;
  return [
    moteur.attendu(
      modele,
      formule,
      premiere,
      'references',
      piegesDuModele,
      confusionSiErreur ?? null,
      tolerance,
    ),
    ...suivantes.map((valeur, rang) =>
      moteur.attendu(
        `${colonne}${premiereLigne + rang + 1}`,
        recopiee(formule, rang + 1),
        valeur,
        { memeQue: modele },
        piegesDeLaRecopie,
        confusionSiErreur ?? null,
        tolerance,
      ),
    ),
  ];
}

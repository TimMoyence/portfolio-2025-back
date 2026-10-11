import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import * as moteur from './briques';

export { avecVirgule } from '../../../../common/domain/nombres/ecriture-francaise';

type PiegeDeCellule = readonly [number, ConfusionId];
export type AttenduDeFeuille = ReturnType<typeof moteur.attendu>;

export function termes<T>(
  suite: (rang: number) => T,
  premier: number,
  dernier: number,
): AuMoinsUnModifiable<T> {
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
  readonly piegesDuRang?: (rang: number) => readonly PiegeDeCellule[];
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
    piegesDuRang = () => [],
    confusionSiErreur,
    tolerance,
  }: Recopie,
  [premiere, ...suivantes]: AuMoinsUnModifiable<number | string>,
): AuMoinsUnModifiable<AttenduDeFeuille> {
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
        [...piegesDeLaRecopie, ...piegesDuRang(rang + 1)],
        confusionSiErreur ?? null,
        tolerance,
      ),
    ),
  ];
}

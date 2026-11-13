import type {
  AuMoinsUn,
  AuMoinsUnModifiable,
} from '../../../../common/domain/objets/au-moins-un';
import { arrondi } from '../../../../common/domain/nombres/arrondi';
import { estEntierStrictementPositif } from '../../../../common/domain/nombres/dans-les-bornes';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import {
  DECALAGES_DE_RECOPIE,
  type SensDeRecopie,
} from '../../domain/cours/evaluation/FeuilleEvaluee';
import { decalerFormule } from '../../domain/cours/formule/Formule';
import { ligneDeLaReference } from '../../domain/cours/stockage/PlansStockes';
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

const CLICS_EN_LETTRES = [
  'une',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
  'vingt',
] as const;

const BOUTONS_DE_RECOPIE: Readonly<Record<SensDeRecopie, string>> = {
  bas: 'Recopier vers le bas',
  droite: 'Recopier vers la droite',
};

export function clicsDeRecopie(
  clics: number,
  sens: SensDeRecopie = 'bas',
): string {
  const enLettres = CLICS_EN_LETTRES.at(clics - 1);
  if (!estEntierStrictementPositif(clics) || enLettres === undefined) {
    throw new RangeError(`une recopie compte de 1 à 20 clics, pas ${clics}`);
  }
  return `cliquez ${enLettres} fois sur « ${BOUTONS_DE_RECOPIE[sens]} »`;
}

export function gesteDeRecopie(
  [premiere, ...autres]: AuMoinsUn<string>,
  derniereLigne: number,
): string {
  const clics = derniereLigne - ligneDeLaReference(premiere);
  const suite =
    autres.length === 0 ? '' : `, puis de même depuis ${autres.join(' et ')}`;
  return `sélectionnez ${premiere} et ${clicsDeRecopie(clics)}, une ligne par clic${suite}`;
}

export function piegeDeLArrondi(
  exacte: number,
  decimales = 1,
): (readonly [number, 'arrondi-oublie'])[] {
  return exacte === arrondi(exacte, decimales)
    ? []
    : [[exacte, 'arrondi-oublie']];
}

export function gesteDeRecopieVersLaDroite(
  source: string,
  derniereColonne: string,
): string {
  const clics =
    (derniereColonne.codePointAt(0) ?? 0) - (source.codePointAt(0) ?? 0);
  return `sélectionnez ${source} et ${clicsDeRecopie(clics, 'droite')}, une cellule par clic`;
}

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
  premiereLigne = 2,
): Record<string, string> {
  return Object.fromEntries(
    valeurs.map((valeur, rang) => [
      `${colonne}${premiereLigne + rang}`,
      String(valeur),
    ]),
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

function cellulesRecopiees(
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
  sens: SensDeRecopie,
  [premiere, ...suivantes]: AuMoinsUnModifiable<number | string>,
): AuMoinsUnModifiable<AttenduDeFeuille> {
  const [lignes, colonnes] = DECALAGES_DE_RECOPIE[sens];
  const celluleDuRang = (rang: number): string =>
    `${String.fromCodePoint((colonne.codePointAt(0) ?? 0) + rang * colonnes)}${premiereLigne + rang * lignes}`;
  const modele = celluleDuRang(0);
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
        celluleDuRang(rang + 1),
        decalerFormule(formule, (rang + 1) * lignes, (rang + 1) * colonnes),
        valeur,
        { memeQue: modele },
        [...piegesDeLaRecopie, ...piegesDuRang(rang + 1)],
        confusionSiErreur ?? null,
        tolerance,
      ),
    ),
  ];
}

export function colonneRecopiee(
  recopie: Recopie,
  valeurs: AuMoinsUnModifiable<number | string>,
): AuMoinsUnModifiable<AttenduDeFeuille> {
  return cellulesRecopiees(recopie, 'bas', valeurs);
}

export function ligneRecopiee(
  recopie: Recopie,
  valeurs: AuMoinsUnModifiable<number | string>,
): AuMoinsUnModifiable<AttenduDeFeuille> {
  return cellulesRecopiees(recopie, 'droite', valeurs);
}

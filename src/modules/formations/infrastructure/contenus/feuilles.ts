import type {
  AuMoinsUn,
  AuMoinsUnModifiable,
} from '../../../../common/domain/au-moins-un';
import type { ConfusionId } from '../../domain/cours/banque/confusions';
import { decalerFormule } from '../../domain/cours/Formule';
import { ligneDeLaReference } from '../../domain/cours/PlansStockes';
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

export function clicsDeRecopie(clics: number): string {
  const enLettres = CLICS_EN_LETTRES.at(clics - 1);
  if (!Number.isInteger(clics) || clics < 1 || enLettres === undefined) {
    throw new RangeError(`une recopie compte de 1 à 20 clics, pas ${clics}`);
  }
  return `cliquez ${enLettres} fois sur « Recopier vers le bas »`;
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
        decalerFormule(formule, rang + 1, 0),
        valeur,
        { memeQue: modele },
        [...piegesDeLaRecopie, ...piegesDuRang(rang + 1)],
        confusionSiErreur ?? null,
        tolerance,
      ),
    ),
  ];
}

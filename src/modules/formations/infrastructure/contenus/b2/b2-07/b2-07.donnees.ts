import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import {
  arrondi,
  auCentime,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  type AttenduDeFeuille,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'fonction-derivee',
  'variations-d-une-fonction',
  'optimisation',
  'tableur',
  'fonction-exponentielle',
  'logarithme-neperien',
  'resolution-par-logarithme',
  'algorithme-de-seuil',
  'suite-geometrique',
  'prevision',
] as const satisfies readonly ConceptId[];

export const CONCEPTS_DE_LA_DERIVEE = [
  'fonction-derivee',
  'variations-d-une-fonction',
  'optimisation',
] as const satisfies readonly ConceptId[];

export const LUE_COMME_PRODUIT = 'exponentielle-lue-comme-produit';
export const AJOUTER_POUR_MULTIPLIER = 'nature-de-suite-confondue';
export const K_POUR_TAUX = 'k-confondu-avec-taux';
export const SEUIL_PAR_DIVISION = 'seuil-par-division';
export const SEUIL_MAL_ARRONDI = 'seuil-mal-arrondi';
export const CONDITION_INVERSEE = 'condition-tant-que-inversee';
export const EXPOSANT = 'exposant-non-descendu';
export const CONSTANTE = 'constante-non-annulee';
export const VALEUR_POUR_PENTE = 'valeur-et-pente-confondues';
export const SANS_K = 'derivee-de-l-exponentielle-sans-k';
export const SIGNE_DE_K = 'signe-de-k-ignore';
export const SENS_INCHANGE = 'sens-inegalite-ln-negatif';
export const SIGNE_DE_F = 'signe-de-f-pour-variations';
export const SANS_CHANGEMENT_DE_SIGNE = 'extremum-sans-changement-de-signe';
export const ABSCISSE_POUR_EXTREMUM = 'abscisse-pour-extremum';
export const BORNES_OUBLIEES = 'bornes-oubliees';
export const CONTRAINTE_IGNOREE = 'contrainte-ignoree';

export const DONNEES_FICTIVES =
  'Données fictives Atelier Rivage, créées pour ce cours.';

export const RENVOI_AU_DOSSIER = 'B2-07-A2-01-DOSSIER';

const COUT_UNITAIRE = 8;
const DEMANDE_A_PRIX_NUL = 360;
const BAISSE_PAR_EURO = 12;
const CAPACITE = 120;
const PRIX_MINIMAL = 12;
const PRIX_MAXIMAL = 28;
const PRIX_DE_LA_PENTE = 15;

const COEFFICIENT_DU_CARRE = -BAISSE_PAR_EURO;
const COEFFICIENT_DE_X = DEMANDE_A_PRIX_NUL + BAISSE_PAR_EURO * COUT_UNITAIRE;
const CONSTANTE_DU_BENEFICE = -COUT_UNITAIRE * DEMANDE_A_PRIX_NUL;

const benefice = (prix: number): number =>
  (prix - COUT_UNITAIRE) * (DEMANDE_A_PRIX_NUL - BAISSE_PAR_EURO * prix);
const pente = (prix: number): number =>
  2 * COEFFICIENT_DU_CARRE * prix + COEFFICIENT_DE_X;
const penteSansExposant = (prix: number): number =>
  COEFFICIENT_DU_CARRE * prix + COEFFICIENT_DE_X;
const penteAvecConstante = (prix: number): number =>
  pente(prix) + CONSTANTE_DU_BENEFICE;

const PRIX_OPTIMAL = COEFFICIENT_DE_X / (-2 * COEFFICIENT_DU_CARRE);
const PRIX_SOUS_CONTRAINTE = (DEMANDE_A_PRIX_NUL - CAPACITE) / BAISSE_PAR_EURO;

const g = (x: number): number => 2 * x ** 3 - 6 * x ** 2 + 5;
const gPrime = (x: number): number => 6 * x ** 2 - 12 * x;
const gPrimeSansExposant = (x: number): number => 2 * x ** 2 - 6 * x;
const POINT_DE_G = 3;

const VENTES_DE_JANVIER = 400;
const K_DES_VENTES = 0.06;
const MOIS_DE_JUIN = 5;
const VENTES_EN_BOUTIQUE = 900;
const K_EN_BOUTIQUE = -0.04;
const MOIS_EN_BOUTIQUE = 10;
const ventes = (mois: number): number =>
  VENTES_DE_JANVIER * Math.exp(K_DES_VENTES * mois);
const enBoutique = (mois: number): number =>
  VENTES_EN_BOUTIQUE * Math.exp(K_EN_BOUTIQUE * mois);

const COUT_DES_PANNES = 50;
const COUT_DES_REVISIONS = 2000;
const K_DES_REVISIONS = -0.1;
const cout = (semaines: number): number =>
  COUT_DES_PANNES * semaines +
  COUT_DES_REVISIONS * Math.exp(K_DES_REVISIONS * semaines);
const PART_DES_REVISIONS =
  COUT_DES_PANNES / (-K_DES_REVISIONS * COUT_DES_REVISIONS);
const SEMAINES_OPTIMALES = Math.log(PART_DES_REVISIONS) / K_DES_REVISIONS;

interface Numerique {
  readonly solution: number;
  readonly pieges: AuMoinsUnModifiable<readonly [number, ConfusionId]>;
}

export const DERIVEE_DE_G: Numerique = {
  solution: gPrime(POINT_DE_G),
  pieges: [
    [gPrimeSansExposant(POINT_DE_G), EXPOSANT],
    [gPrime(POINT_DE_G) + 5, CONSTANTE],
    [g(POINT_DE_G), VALEUR_POUR_PENTE],
  ],
};

export const PENTE_A_15_EUROS: Numerique = {
  solution: pente(PRIX_DE_LA_PENTE),
  pieges: [
    [benefice(PRIX_DE_LA_PENTE), VALEUR_POUR_PENTE],
    [penteSansExposant(PRIX_DE_LA_PENTE), EXPOSANT],
  ],
};

export const VITESSE_EN_JUIN: Numerique = {
  solution: auCentime(K_DES_VENTES * ventes(MOIS_DE_JUIN)),
  pieges: [[auCentime(ventes(MOIS_DE_JUIN)), VALEUR_POUR_PENTE]],
};

export const VITESSE_EN_BOUTIQUE: Numerique = {
  solution: auCentime(K_EN_BOUTIQUE * enBoutique(MOIS_EN_BOUTIQUE)),
  pieges: [
    [auCentime(-K_EN_BOUTIQUE * enBoutique(MOIS_EN_BOUTIQUE)), SIGNE_DE_K],
    [auCentime(enBoutique(MOIS_EN_BOUTIQUE)), VALEUR_POUR_PENTE],
  ],
};

export const BENEFICE_AU_DEPART: Numerique = {
  solution: benefice(PRIX_MINIMAL),
  pieges: [[pente(PRIX_MINIMAL), VALEUR_POUR_PENTE]],
};

export const BENEFICE_A_L_ARRIVEE: Numerique = {
  solution: benefice(PRIX_MAXIMAL),
  pieges: [[pente(PRIX_MAXIMAL), VALEUR_POUR_PENTE]],
};

export const BENEFICE_MAXIMAL: Numerique = {
  solution: benefice(PRIX_OPTIMAL),
  pieges: [
    [PRIX_OPTIMAL, ABSCISSE_POUR_EXTREMUM],
    [pente(PRIX_OPTIMAL), VALEUR_POUR_PENTE],
  ],
};

export const PRIX_RETENU: Numerique = {
  solution: PRIX_SOUS_CONTRAINTE,
  pieges: [
    [PRIX_OPTIMAL, CONTRAINTE_IGNOREE],
    [PRIX_MAXIMAL, BORNES_OUBLIEES],
  ],
};

export const BENEFICE_SOUS_CONTRAINTE: Numerique = {
  solution: benefice(PRIX_SOUS_CONTRAINTE),
  pieges: [
    [benefice(PRIX_OPTIMAL), CONTRAINTE_IGNOREE],
    [benefice(PRIX_MAXIMAL), BORNES_OUBLIEES],
  ],
};

export const INTERVALLE_OPTIMAL: Numerique = {
  solution: auCentime(SEMAINES_OPTIMALES),
  pieges: [
    [auCentime(PART_DES_REVISIONS / -K_DES_REVISIONS), SEUIL_PAR_DIVISION],
    [auCentime(-SEMAINES_OPTIMALES), SIGNE_DE_K],
  ],
};

export const COUT_MINIMAL: Numerique = {
  solution: arrondi(cout(SEMAINES_OPTIMALES), 0),
  pieges: [
    [auCentime(SEMAINES_OPTIMALES), ABSCISSE_POUR_EXTREMUM],
    [0, VALEUR_POUR_PENTE],
  ],
};

const PRIX_DE_LA_FEUILLE = [13, 15, 17, 19, 21, 23, 25, 27] as const;
const DERNIERE_LIGNE = PRIX_DE_LA_FEUILLE.length + 1;

export const FORMULE_DU_BENEFICE = '=-12*A2^2+456*A2-2880';
export const FORMULE_DE_LA_PENTE = '=-24*A2+456';

const CELLULES_DU_BENEFICE = {
  A1: 'Prix x (€)',
  B1: 'Bénéfice B(x) (€)',
  C1: 'B′(x)',
  ...colonneDeValeurs('A', PRIX_DE_LA_FEUILLE),
};

export const PLAN_DU_BENEFICE = {
  id: 'b2-07-a4-tableur-benefice',
  intitule: 'Exercice 5 — Le bénéfice au tableur',
  lignes: DERNIERE_LIGNE,
  colonnes: 3,
  cellules: CELLULES_DU_BENEFICE,
  verrouillees: Object.keys(CELLULES_DU_BENEFICE),
  consignes: [
    `En B2, écrivez le bénéfice B(x) = −12x² + 456x − 2 880 pour le prix de la ligne, le carré s’écrivant A2^2. Recopiez-la jusqu’en B${DERNIERE_LIGNE} : ${gesteDeRecopie(['B2'], DERNIERE_LIGNE)}.`,
    `En C2, écrivez la dérivée B′(x) pour le prix de la ligne. Recopiez-la jusqu’en C${DERNIERE_LIGNE} : ${gesteDeRecopie(['C2'], DERNIERE_LIGNE)}.`,
    'Repérez la ligne où B′(x) s’annule en changeant de signe : le bénéfice y passe par son maximum.',
  ],
};

const piegesDeLaPente = (rang: number) =>
  [
    [auMillionieme(penteSansExposant(PRIX_DE_LA_FEUILLE[rang])), EXPOSANT],
    [auMillionieme(penteAvecConstante(PRIX_DE_LA_FEUILLE[rang])), CONSTANTE],
    [auMillionieme(benefice(PRIX_DE_LA_FEUILLE[rang])), VALEUR_POUR_PENTE],
  ] as const;

const deLaFeuille = (calcul: (prix: number) => number) => {
  const [premier, ...suivants] = PRIX_DE_LA_FEUILLE.map(calcul);
  return [premier, ...suivants] satisfies AuMoinsUnModifiable<number>;
};

export const ATTENDUS_DU_BENEFICE: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    { colonne: 'B', premiereLigne: 2, formule: FORMULE_DU_BENEFICE },
    deLaFeuille(benefice),
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 2,
      formule: FORMULE_DE_LA_PENTE,
      piegesDuModele: piegesDeLaPente(0),
      piegesDuRang: piegesDeLaPente,
    },
    deLaFeuille(pente),
  ),
];

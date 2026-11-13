import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import {
  arrondi,
  auCentime,
} from '../../../../../../common/domain/nombres/arrondi';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import {
  avecVirgule,
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  type AttenduDeFeuille,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'derivees-composees',
  'fonctions-economiques',
  'resolution-approchee',
  'fonction-derivee',
  'variations-d-une-fonction',
  'optimisation',
  'fonction-exponentielle',
  'logarithme-neperien',
  'resolution-par-logarithme',
  'tableur',
] as const satisfies readonly ConceptId[];

export const VALEUR_POUR_PENTE = 'valeur-et-pente-confondues';
export const SANS_K = 'derivee-de-l-exponentielle-sans-k';
export const SIGNE_DE_K = 'signe-de-k-ignore';
export const SANS_CHANGEMENT_DE_SIGNE = 'extremum-sans-changement-de-signe';
export const ABSCISSE_POUR_EXTREMUM = 'abscisse-pour-extremum';
export const SEUIL_PAR_DIVISION = 'seuil-par-division';
export const PRODUIT_TERME_A_TERME = 'produit-derive-terme-a-terme';
export const QUOTIENT_INVERSE = 'quotient-signe-inverse';
export const QUOTIENT_SANS_CARRE = 'quotient-sans-carre';
export const SANS_U_PRIME = 'u-prime-oublie';
export const MOYEN_POUR_MARGINAL = 'cout-moyen-et-marginal-confondus';
export const RECETTE_SANS_PRIX = 'recette-sans-prix';
export const SANS_VARIATIONS = 'nombre-de-solutions-sans-variations';
export const MAL_ENCADRE = 'balayage-mal-encadre';
export const MAUVAISE_MOITIE = 'dichotomie-mauvaise-moitie';

export const RENVOI_AU_DOSSIER = 'B2-08-A2-01-DOSSIER';

interface Numerique {
  readonly solution: number;
  readonly pieges: AuMoinsUnModifiable<readonly [number, ConfusionId]>;
}

const POINT_DU_PRODUIT = 2;
const produit = (x: number): number => (3 * x - 2) * Math.exp(0.5 * x);
const deriveeDuProduit = (x: number): number =>
  (1.5 * x + 2) * Math.exp(0.5 * x);
const produitDesDerivees = (x: number): number => 3 * 0.5 * Math.exp(0.5 * x);

const POINT_DU_QUOTIENT = 1;
const quotient = (x: number): number => (2 * x + 1) / (x + 3);
const deriveeDuQuotient = (x: number): number => 5 / (x + 3) ** 2;
const deriveeSansCarre = (x: number): number => 5 / (x + 3);

const POINT_DU_LOGARITHME = 3;
const logarithme = (x: number): number => Math.log(x ** 2 + 5);
const deriveeDuLogarithme = (x: number): number => (2 * x) / (x ** 2 + 5);
const deriveeSansUPrime = (x: number): number => 1 / (x ** 2 + 5);

const POINT_DU_CALCUL_FORMEL = 2;
const formel = (x: number): number => (x ** 2 + 1) * Math.exp(-x);
const deriveeFormelle = (x: number): number => -((x - 1) ** 2) * Math.exp(-x);

const cout = (q: number): number => q ** 3 - 6 * q ** 2 + 20 * q + 100;
const coutMarginal = (q: number): number => 3 * q ** 2 - 12 * q + 20;
const coutMoyen = (q: number): number => cout(q) / q;
const PRODUCTION_DU_MARGINAL = 3;
const PRODUCTION_OPTIMALE = 5;
const MINIMUM_DU_MARGINAL = 2;

const K_DE_LA_DEMANDE = -0.04;
const K_DE_L_OFFRE = 0.05;
const RAPPORT_DEMANDE_SUR_OFFRE = 900 / 100;
const demande = (p: number): number => 900 * Math.exp(K_DE_LA_DEMANDE * p);
const recette = (p: number): number => p * demande(p);
const PRIX_D_EQUILIBRE_EXACT =
  Math.log(RAPPORT_DEMANDE_SUR_OFFRE) / (K_DE_L_OFFRE - K_DE_LA_DEMANDE);
const PRIX_D_EQUILIBRE_SANS_SIGNE =
  Math.log(RAPPORT_DEMANDE_SUR_OFFRE) / (K_DE_L_OFFRE + K_DE_LA_DEMANDE);
const PRIX_DE_LA_RECETTE_MAXIMALE = 1 / -K_DE_LA_DEMANDE;

const abonnes = (t: number): number => 3000 / (1 + 29 * Math.exp(-0.5 * t));
const abonnesSansSigne = (t: number): number =>
  3000 / (1 + 29 * Math.exp(0.5 * t));
const SEUIL_D_ABONNES = 2500;
const SOLUTION_EXACTE = -2 * Math.log((3000 / SEUIL_D_ABONNES - 1) / 29);
const DIXIEMES = 10;

function milieux(
  [depart, arrivee]: readonly [number, number],
  etapes: number,
): number[] {
  const calcules: number[] = [];
  let [gauche, droite] = [depart, arrivee];
  for (let etape = 0; etape < etapes; etape += 1) {
    const milieu = (gauche + droite) / 2;
    calcules.push(milieu);
    if (abonnes(milieu) < SEUIL_D_ABONNES) {
      gauche = milieu;
    } else {
      droite = milieu;
    }
  }
  return calcules;
}

const [, DEUXIEME_MILIEU, TROISIEME_MILIEU, QUATRIEME_MILIEU] = milieux(
  [0, 20],
  4,
);

export const PRODUIT_EN_2: Numerique = {
  solution: auCentime(deriveeDuProduit(POINT_DU_PRODUIT)),
  pieges: [
    [auCentime(produitDesDerivees(POINT_DU_PRODUIT)), PRODUIT_TERME_A_TERME],
    [auCentime(produit(POINT_DU_PRODUIT)), VALEUR_POUR_PENTE],
  ],
};

export const QUOTIENT_EN_1: Numerique = {
  solution: auCentime(deriveeDuQuotient(POINT_DU_QUOTIENT)),
  pieges: [
    [auCentime(-deriveeDuQuotient(POINT_DU_QUOTIENT)), QUOTIENT_INVERSE],
    [deriveeSansCarre(POINT_DU_QUOTIENT), QUOTIENT_SANS_CARRE],
    [quotient(POINT_DU_QUOTIENT), VALEUR_POUR_PENTE],
  ],
};

export const LOGARITHME_EN_3: Numerique = {
  solution: auCentime(deriveeDuLogarithme(POINT_DU_LOGARITHME)),
  pieges: [
    [auCentime(deriveeSansUPrime(POINT_DU_LOGARITHME)), SANS_U_PRIME],
    [auCentime(logarithme(POINT_DU_LOGARITHME)), VALEUR_POUR_PENTE],
  ],
};

export const CALCUL_FORMEL_EN_2: Numerique = {
  solution: auCentime(deriveeFormelle(POINT_DU_CALCUL_FORMEL)),
  pieges: [[auCentime(formel(POINT_DU_CALCUL_FORMEL)), VALEUR_POUR_PENTE]],
};

export const COUT_MARGINAL_EN_3: Numerique = {
  solution: coutMarginal(PRODUCTION_DU_MARGINAL),
  pieges: [[auCentime(coutMoyen(PRODUCTION_DU_MARGINAL)), MOYEN_POUR_MARGINAL]],
};

export const COUT_MOYEN_MINIMAL: Numerique = {
  solution: coutMoyen(PRODUCTION_OPTIMALE),
  pieges: [
    [PRODUCTION_OPTIMALE, ABSCISSE_POUR_EXTREMUM],
    [coutMarginal(MINIMUM_DU_MARGINAL), MOYEN_POUR_MARGINAL],
  ],
};

export const PRIX_D_EQUILIBRE: Numerique = {
  solution: auCentime(PRIX_D_EQUILIBRE_EXACT),
  pieges: [[auCentime(PRIX_D_EQUILIBRE_SANS_SIGNE), SIGNE_DE_K]],
};

export const RECETTE_MAXIMALE: Numerique = {
  solution: arrondi(recette(PRIX_DE_LA_RECETTE_MAXIMALE), 0),
  pieges: [
    [PRIX_DE_LA_RECETTE_MAXIMALE, ABSCISSE_POUR_EXTREMUM],
    [arrondi(demande(PRIX_DE_LA_RECETTE_MAXIMALE), 0), RECETTE_SANS_PRIX],
  ],
};

export const VALEUR_APPROCHEE: Numerique = {
  solution: Math.floor(SOLUTION_EXACTE * DIXIEMES) / DIXIEMES,
  pieges: [[Math.ceil(SOLUTION_EXACTE * DIXIEMES) / DIXIEMES, MAL_ENCADRE]],
};

export const MILIEU_DE_LA_DICHOTOMIE: Numerique = {
  solution: QUATRIEME_MILIEU,
  pieges: [[(DEUXIEME_MILIEU + TROISIEME_MILIEU) / 2, MAUVAISE_MOITIE]],
};

const MOIS_DE_LA_FEUILLE = Array.from(
  { length: 11 },
  (_, rang) => (90 + rang) / DIXIEMES,
);
const DERNIERE_LIGNE = MOIS_DE_LA_FEUILLE.length + 1;

export const FORMULE_DU_BALAYAGE = '=3000/(1+29*EXP(-0,5*A2))';

const CELLULES_DU_BALAYAGE = {
  A1: 'Mois t',
  B1: 'Abonnés N(t)',
  ...colonneDeValeurs(
    'A',
    MOIS_DE_LA_FEUILLE.map((mois) => avecVirgule(mois, 1)),
  ),
};

export const PLAN_DU_BALAYAGE = {
  id: 'b2-08-a4-tableur-balayage',
  intitule: 'Exercice 6 — Le balayage au tableur',
  lignes: DERNIERE_LIGNE,
  colonnes: 2,
  cellules: CELLULES_DU_BALAYAGE,
  verrouillees: Object.keys(CELLULES_DU_BALAYAGE),
  consignes: [
    `En B2, écrivez N(t) = 3 000 / (1 + 29e^(−0,5t)) pour le mois de la ligne, avec EXP et des parenthèses autour du dénominateur. Recopiez-la jusqu’en B${DERNIERE_LIGNE} : ${gesteDeRecopie(['B2'], DERNIERE_LIGNE)}.`,
    'Repérez les deux lignes entre lesquelles N(t) passe 2 500 : la solution de N(t) = 2 500 est entre leurs deux mois.',
  ],
};

const [PREMIER_MOIS, ...MOIS_SUIVANTS] = MOIS_DE_LA_FEUILLE;

const piegesDuBalayage = (rang: number) =>
  [[abonnesSansSigne(MOIS_DE_LA_FEUILLE[rang]), SIGNE_DE_K]] as const;

export const ATTENDUS_DU_BALAYAGE: AuMoinsUnModifiable<AttenduDeFeuille> =
  colonneRecopiee(
    {
      colonne: 'B',
      premiereLigne: 2,
      formule: FORMULE_DU_BALAYAGE,
      piegesDuModele: piegesDuBalayage(0),
      piegesDuRang: piegesDuBalayage,
    },
    [abonnes(PREMIER_MOIS), ...MOIS_SUIVANTS.map(abonnes)],
  );

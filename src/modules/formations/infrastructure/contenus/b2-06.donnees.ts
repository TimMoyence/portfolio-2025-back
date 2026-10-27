import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import * as moteur from './briques';
import {
  avecVirgule,
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  rangIdentique,
  termes,
  type AttenduDeFeuille,
} from './feuilles';

export const CONCEPTS_DU_COURS = [
  'fonction-exponentielle',
  'logarithme-neperien',
  'resolution-par-logarithme',
  'ajustement-exponentiel',
  'tableur',
  'interets-composes',
  'suite-geometrique',
  'coefficient-multiplicateur',
  'ajustement-affine',
  'prevision',
] as const satisfies readonly ConceptId[];

export const CONCEPTS_DE_L_EXPONENTIELLE = [
  'fonction-exponentielle',
  'logarithme-neperien',
  'resolution-par-logarithme',
  'ajustement-exponentiel',
  'tableur',
] as const satisfies readonly ConceptId[];

const VENTES_DE_JANVIER = 400;
const K_DES_VENTES = 0.06;
const DERNIER_MOIS_DE_LA_FEUILLE = 6;
const OBJECTIFS = [500, 600, 800, 1000, 1200, 1500] as const;

export const PRIX_DE_GROS = [20, 25, 30, 35, 40, 45] as const;
export const DEMANDES = [1100, 860, 670, 520, 410, 315] as const;

export const TAUX_POUR_COEFFICIENT = 'coefficient-confondu-avec-taux';
export const INTERETS_SIMPLES = 'interets-simples-au-lieu-de-composes';
export const NON_FIGEE = 'reference-relative-non-figee';
export const LUE_COMME_PRODUIT = 'exponentielle-lue-comme-produit';
export const SIGNE_DE_K = 'signe-de-k-ignore';
export const K_POUR_TAUX = 'k-confondu-avec-taux';
export const LN_EN_PRODUIT = 'ln-produit-en-produit';
export const TOUCHE_LOG = 'log-decimal-au-lieu-de-ln';
export const SEUIL_PAR_DIVISION = 'seuil-par-division';
export const SENS_INCHANGE = 'sens-inegalite-ln-negatif';
export const SEUIL_MAL_ARRONDI = 'seuil-mal-arrondi';
export const AJUSTEMENT_DE_Y = 'ajustement-affine-sur-y';
export const ORDONNEE_NON_EXPONENTIEE = 'ordonnee-non-exponentiee';
export const SERIES_INVERSEES = 'pente-ordonnee-inversees';

export const DONNEES_FICTIVES =
  'Données fictives Atelier Rivage, créées pour ce cours.';

export const RENVOI_AU_DOSSIER = 'B2-06-A1-05-DOSSIER';

const ventes = (mois: number): number =>
  auMillionieme(VENTES_DE_JANVIER * Math.exp(K_DES_VENTES * mois));
const ventesLuesCommeProduit = (mois: number): number =>
  auMillionieme(VENTES_DE_JANVIER * Math.E * K_DES_VENTES * mois);
const ventesAuTauxK = (mois: number): number =>
  auMillionieme(VENTES_DE_JANVIER * (1 + K_DES_VENTES) ** mois);
const TAUX_MENSUEL = auMillionieme(Math.exp(K_DES_VENTES) - 1);
const PIEGES_DU_TAUX = [
  [auMillionieme(TAUX_MENSUEL + 1), TAUX_POUR_COEFFICIENT],
  [K_DES_VENTES, K_POUR_TAUX],
] as const;

export const FORMULE_DES_VENTES = '=$E$1*EXP($G$1*A2)';
export const FORMULE_DU_TAUX_MENSUEL = '=B3/B2-1';

const PARAMETRES_DES_VENTES = {
  D1: 'a (sacs)',
  E1: String(VENTES_DE_JANVIER),
  F1: 'k',
  G1: avecVirgule(K_DES_VENTES, 2),
};

const CELLULES_DES_VENTES = {
  A1: 'Mois x',
  B1: 'Ventes V(x) (sacs)',
  C1: 'Taux d’évolution sur un mois',
  ...PARAMETRES_DES_VENTES,
  ...colonneDeValeurs(
    'A',
    termes(rangIdentique, 0, DERNIER_MOIS_DE_LA_FEUILLE),
  ),
};

export const PLAN_DES_VENTES = {
  id: 'b2-06-a1-tableur-ventes',
  intitule: 'Exercice 2 — Les ventes au tableur',
  lignes: DERNIER_MOIS_DE_LA_FEUILLE + 2,
  colonnes: 7,
  cellules: CELLULES_DES_VENTES,
  verrouillees: Object.keys(CELLULES_DES_VENTES),
  consignes: [
    `En B2, écrivez la formule des ventes V(x) = a e^(kx) du mois de la ligne, avec EXP, a en E1 et k en G1. Recopiez-la jusqu’en B8 : ${gesteDeRecopie(['B2'], 8)}.`,
    `En C3, écrivez le taux d’évolution des ventes entre le mois de la ligne 2 et celui de la ligne 3. Recopiez jusqu’en C8 : ${gesteDeRecopie(['C3'], 8)}.`,
    'a et k ne s’écrivent pas dans la formule : utilisez E1 et G1, figés par des $.',
  ],
};

export const ATTENDUS_DES_VENTES: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'B',
      premiereLigne: 2,
      formule: FORMULE_DES_VENTES,
      piegesDuModele: [[0, LUE_COMME_PRODUIT]],
      piegesDeLaRecopie: [[0, NON_FIGEE]],
      piegesDuRang: (mois) => [
        [ventesLuesCommeProduit(mois), LUE_COMME_PRODUIT],
        [ventesAuTauxK(mois), K_POUR_TAUX],
      ],
    },
    termes(ventes, 0, DERNIER_MOIS_DE_LA_FEUILLE),
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 3,
      formule: FORMULE_DU_TAUX_MENSUEL,
      piegesDuModele: PIEGES_DU_TAUX,
      piegesDeLaRecopie: PIEGES_DU_TAUX,
    },
    termes(() => TAUX_MENSUEL, 1, DERNIER_MOIS_DE_LA_FEUILLE),
  ),
];

export const FORMULE_DE_L_EXPOSANT = '=LN(A2/$E$1)';
export const FORMULE_DU_MOIS_EXACT = '=B2/$G$1';

const exposant = (objectif: number): number =>
  auMillionieme(Math.log(objectif / VENTES_DE_JANVIER));
const part = (objectif: number): number =>
  auMillionieme(objectif / VENTES_DE_JANVIER);
const quotientDesLogarithmes = (objectif: number): number =>
  auMillionieme(Math.log(objectif) / Math.log(VENTES_DE_JANVIER));

const CELLULES_DES_OBJECTIFS = {
  A1: 'Objectif s (sacs par mois)',
  B1: 'ln(s ÷ a)',
  C1: 'Mois exact x',
  ...PARAMETRES_DES_VENTES,
  ...colonneDeValeurs('A', OBJECTIFS),
};

export const PLAN_DES_OBJECTIFS = {
  id: 'b2-06-a2-tableur-objectifs',
  intitule: 'Exercice 4 — Les objectifs de ventes au tableur',
  lignes: OBJECTIFS.length + 1,
  colonnes: 7,
  cellules: CELLULES_DES_OBJECTIFS,
  verrouillees: Object.keys(CELLULES_DES_OBJECTIFS),
  consignes: [
    'Pour chaque objectif s de la colonne A, on résout 400e^(0,06x) = s.',
    `En B2, calculez ln(s ÷ a) avec LN, a en E1. Recopiez jusqu’en B7 : ${gesteDeRecopie(['B2'], 7)}.`,
    `En C2, calculez le mois exact x en divisant par k (G1). Recopiez jusqu’en C7 : ${gesteDeRecopie(['C2'], 7)}.`,
    'a et k ne s’écrivent pas dans les formules : utilisez E1 et G1, figés par des $.',
  ],
};

const DERNIER_OBJECTIF = OBJECTIFS.length - 1;

const piegesDeLExposant = (rang: number) =>
  [
    [part(OBJECTIFS[rang]), SEUIL_PAR_DIVISION],
    [quotientDesLogarithmes(OBJECTIFS[rang]), LN_EN_PRODUIT],
  ] as const;
const piegesDuMoisExact = (rang: number) =>
  [
    [auMillionieme(part(OBJECTIFS[rang]) / K_DES_VENTES), SEUIL_PAR_DIVISION],
  ] as const;

export const ATTENDUS_DES_OBJECTIFS: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'B',
      premiereLigne: 2,
      formule: FORMULE_DE_L_EXPOSANT,
      piegesDuModele: piegesDeLExposant(0),
      piegesDuRang: piegesDeLExposant,
      confusionSiErreur: NON_FIGEE,
    },
    termes((rang) => exposant(OBJECTIFS[rang]), 0, DERNIER_OBJECTIF),
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 2,
      formule: FORMULE_DU_MOIS_EXACT,
      piegesDuModele: piegesDuMoisExact(0),
      piegesDuRang: piegesDuMoisExact,
      confusionSiErreur: NON_FIGEE,
    },
    termes(
      (rang) =>
        auMillionieme(
          Math.log(OBJECTIFS[rang] / VENTES_DE_JANVIER) / K_DES_VENTES,
        ),
      0,
      DERNIER_OBJECTIF,
    ),
  ),
];

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

const auMillieme = (valeur: number): number => arrondi(valeur, 3);

export const [PREMIER_LOGARITHME, ...AUTRES_LOGARITHMES] =
  DEMANDES.map<AttenduDeTableau>((demande, rang) => ({
    rang,
    cle: 'z',
    valeur: auMillieme(Math.log(demande)),
    pieges: [
      { valeur: auMillieme(Math.log10(demande)), confusion: TOUCHE_LOG },
    ],
  }));

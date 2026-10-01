import type { ConceptId } from '../../domain/cours/banque/concepts';
import * as moteur from './briques';
import {
  auMillionieme,
  avecVirgule,
  colonneDeValeurs,
  colonneRecopiee,
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

const PRIX_DES_KITS = [1, 1.5, 2, 2.5, 3, 3.5] as const;
const DEMANDES_DES_KITS = [9.9, 7, 4.9, 3.5, 2.4, 1.7] as const;
const PRIX_DE_LA_FEUILLE = 4;

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
export const RENVOI_AUX_KITS = 'B2-06-A4-01-SITUATION-KITS';

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
    'En B2, écrivez la formule des ventes V(x) = a e^(kx) du mois de la ligne, avec EXP, a en E1 et k en G1. Recopiez-la jusqu’en B8.',
    'En C3, écrivez le taux d’évolution des ventes entre le mois de la ligne 2 et celui de la ligne 3. Recopiez jusqu’en C8.',
    'a et k ne s’écrivent pas dans la formule : utilisez E1 et G1, figés par des $.',
  ],
};

export const ATTENDUS_DES_VENTES: moteur.AuMoinsUn<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'B',
      premiereLigne: 2,
      formule: FORMULE_DES_VENTES,
      piegesDuModele: [[0, LUE_COMME_PRODUIT]],
      piegesDeLaRecopie: [
        [0, NON_FIGEE],
        [VENTES_DE_JANVIER, NON_FIGEE],
      ],
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
    'En B2, calculez ln(s ÷ a) avec LN, a en E1. Recopiez jusqu’en B7.',
    'En C2, calculez le mois exact x en divisant par k (G1). Recopiez jusqu’en C7.',
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

export const ATTENDUS_DES_OBJECTIFS: moteur.AuMoinsUn<AttenduDeFeuille> = [
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

interface Droite {
  readonly pente: number;
  readonly ordonnee: number;
}

function moindresCarres(
  abscisses: readonly number[],
  ordonnees: readonly number[],
): Droite {
  const moyenne = (valeurs: readonly number[]): number =>
    valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length;
  const mx = moyenne(abscisses);
  const my = moyenne(ordonnees);
  const covariance = moyenne(
    abscisses.map((x, rang) => (x - mx) * (ordonnees[rang] - my)),
  );
  const variance = moyenne(abscisses.map((x) => (x - mx) ** 2));
  const pente = covariance / variance;
  return { pente, ordonnee: my - pente * mx };
}

const LOGARITHMES_DES_KITS = DEMANDES_DES_KITS.map((demande) =>
  Math.log(demande),
);
const DROITE_DES_KITS = moindresCarres(PRIX_DES_KITS, LOGARITHMES_DES_KITS);
const DROITE_AFFINE_DES_KITS = moindresCarres(PRIX_DES_KITS, DEMANDES_DES_KITS);
const DROITE_INVERSEE_DES_KITS = moindresCarres(
  LOGARITHMES_DES_KITS,
  PRIX_DES_KITS,
);
const COEFFICIENT_DES_KITS = Math.exp(DROITE_DES_KITS.ordonnee);

const enDecimal = (valeur: number): string => String(valeur).replace('.', ',');

export const FORMULE_DU_LOGARITHME = '=LN(B2)';
export const FORMULE_DE_LA_PENTE = '=PENTE(C2:C7;A2:A7)';
export const FORMULE_DE_L_ORDONNEE = '=ORDONNEE.ORIGINE(C2:C7;A2:A7)';
export const FORMULE_DU_COEFFICIENT = '=EXP(E2)';
export const FORMULE_DE_LA_PREVISION = '=F2*EXP(D2*4)';

const CELLULES_DES_KITS = {
  A1: 'Prix x (dizaines d’euros)',
  B1: 'Demande y (centaines de kits)',
  C1: 'z = ln y',
  D1: 'Pente α',
  E1: 'Ordonnée à l’origine β',
  F1: 'Coefficient a = e^β',
  G1: 'Demande prévue à 40 € (centaines)',
  ...colonneDeValeurs('A', PRIX_DES_KITS.map(enDecimal)),
  ...colonneDeValeurs('B', DEMANDES_DES_KITS.map(enDecimal)),
};

export const PLAN_DES_KITS = {
  id: 'b2-06-a4-feuille-kits',
  intitule: 'Question tableur (3 points) — Ajuster la demande des kits',
  lignes: PRIX_DES_KITS.length + 1,
  colonnes: 7,
  cellules: CELLULES_DES_KITS,
  verrouillees: Object.keys(CELLULES_DES_KITS),
  consignes: [
    'En C2, calculez z = ln y avec LN. Recopiez jusqu’en C7.',
    'En D2 et E2, calculez la pente et l’ordonnée à l’origine de la droite d’ajustement de z en x, avec PENTE et ORDONNEE.ORIGINE.',
    'En F2, calculez le coefficient a du modèle y = a e^(αx).',
    'En G2, calculez la demande prévue au prix de 40 €, soit x = 4, à partir de F2 et D2.',
  ],
};

export const ATTENDUS_DES_KITS: moteur.AuMoinsUn<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 2,
      formule: FORMULE_DU_LOGARITHME,
    },
    termes(
      (rang) => auMillionieme(LOGARITHMES_DES_KITS[rang]),
      0,
      LOGARITHMES_DES_KITS.length - 1,
    ),
  ),
  moteur.attendu(
    'D2',
    FORMULE_DE_LA_PENTE,
    auMillionieme(DROITE_DES_KITS.pente),
    'references',
    [
      [auMillionieme(DROITE_AFFINE_DES_KITS.pente), AJUSTEMENT_DE_Y],
      [auMillionieme(DROITE_INVERSEE_DES_KITS.pente), SERIES_INVERSEES],
    ],
  ),
  moteur.attendu(
    'E2',
    FORMULE_DE_L_ORDONNEE,
    auMillionieme(DROITE_DES_KITS.ordonnee),
    'references',
    [
      [auMillionieme(DROITE_AFFINE_DES_KITS.ordonnee), AJUSTEMENT_DE_Y],
      [auMillionieme(DROITE_INVERSEE_DES_KITS.ordonnee), SERIES_INVERSEES],
    ],
  ),
  moteur.attendu(
    'F2',
    FORMULE_DU_COEFFICIENT,
    auMillionieme(COEFFICIENT_DES_KITS),
    'references',
    [[auMillionieme(DROITE_DES_KITS.ordonnee), ORDONNEE_NON_EXPONENTIEE]],
  ),
  moteur.attendu(
    'G2',
    FORMULE_DE_LA_PREVISION,
    auMillionieme(
      COEFFICIENT_DES_KITS *
        Math.exp(DROITE_DES_KITS.pente * PRIX_DE_LA_FEUILLE),
    ),
    'references',
    [
      [
        auMillionieme(
          COEFFICIENT_DES_KITS *
            Math.E *
            DROITE_DES_KITS.pente *
            PRIX_DE_LA_FEUILLE,
        ),
        LUE_COMME_PRODUIT,
      ],
      [
        auMillionieme(
          DROITE_DES_KITS.ordonnee *
            Math.exp(DROITE_DES_KITS.pente * PRIX_DE_LA_FEUILLE),
        ),
        ORDONNEE_NON_EXPONENTIEE,
      ],
    ],
  ),
];

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

const auMillieme = (valeur: number): number => Number(valeur.toFixed(3));

export const [PREMIER_LOGARITHME, ...AUTRES_LOGARITHMES] =
  DEMANDES.map<AttenduDeTableau>((demande, rang) => ({
    rang,
    cle: 'z',
    valeur: auMillieme(Math.log(demande)),
    pieges: [
      { valeur: auMillieme(Math.log10(demande)), confusion: TOUCHE_LOG },
    ],
  }));

export const PARCOURS_DU_COFFRE = 'b2-06-a4-coffre-kits';

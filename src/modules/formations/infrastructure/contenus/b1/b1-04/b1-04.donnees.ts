import {
  auCentime,
  auMillieme,
} from '../../../../../../common/domain/nombres/arrondi';
import { somme } from '../../../../../../common/domain/nombres/statistiques';
import {
  exigerAuMoinsUn,
  type AuMoinsUn,
} from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import { evaluerCellule } from '../../../../domain/cours/formule/Formule';
import * as moteur from '../../briques';
import {
  colonneDeValeurs,
  gesteDeRecopieVersLaDroite,
  ligneRecopiee,
  piegeDeLArrondi,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'nuage-de-points',
  'ajustement-affine',
  'correlation',
  'lecture-graphique',
  'prevision',
  'tableur',
] as const satisfies readonly ConceptId[];

export const POINT_MOYEN_CONFONDU = 'point-moyen-confondu';
export const PENTE_INVERSEE = 'pente-ordonnee-inversees';
export const SIGNE = 'correlation-jugee-au-signe';
export const R_POUR_PENTE = 'correlation-lue-comme-pente';
export const NON_FIGEE = 'reference-non-figee-en-ligne';
export const CAUSALITE = 'correlation-prise-pour-causalite';
export const EXTRAPOLATION = 'extrapolation-sans-reserve';
export const RANG_POUR_ANNEE = 'rang-pris-pour-annee';
export const SEUIL = 'seuil-mal-arrondi';

export const RENVOI_AU_DOSSIER = 'B1-04-A1-04-DOSSIER';
export const RENVOI_AU_NUAGE_DE_L_ANNALE = 'B1-04-A3-05-NUAGE-ANNALE';

const MOIS_OBSERVES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
] as const;

type Serie = readonly number[];

export const BUDGETS_DU_SITE: Serie = [
  400, 600, 500, 800, 700, 900, 1000, 1200, 1100, 1300,
];
export const CA_DU_SITE: Serie = [
  21000, 26000, 23000, 30000, 29000, 32000, 35000, 41000, 37000, 43000,
];

export const CA_DE_NANTES: Serie = [52, 49, 46, 40, 39, 33, 31, 30, 35, 41];
export const TEMPERATURES_DE_NANTES: Serie = [
  6, 7, 10, 13, 16, 20, 23, 22, 18, 14,
];
export const SOIREES_DE_NANTES: Serie = [8, 6, 9, 5, 7, 6, 4, 6, 5, 8];

export const MOIS_D_HIVER = [
  'Octobre',
  'Novembre',
  'Décembre',
  'Janvier',
  'Février',
  'Mars',
] as const;
export const CHOCOLATS_CHAUDS: Serie = [120, 180, 260, 310, 290, 150];
export const JEUX_VENDUS: Serie = [230, 250, 350, 380, 330, 260];

export const SOIREES_D_ANGERS = [2, 4, 6, 8, 10] as const;
export const CA_D_ANGERS = [5, 9, 10, 14, 17] as const;

export const TEMPERATURES_DE_TOURS = [4, 8, 12, 16, 20, 24] as const;
export const CAFES_DE_TOURS = [210, 190, 175, 150, 140, 115] as const;
export const MATCHS_DE_TOURS = [3, 1, 2, 4, 2, 3] as const;

export const PREMIERE_ANNEE_DE_L_ANNALE = 2006;
export const ESPERANCES_DE_VIE: Serie = [
  84.2, 84.4, 84.3, 84.4, 84.6, 85, 84.8, 85, 85.4, 85.1, 85.4,
];
export const DROITE_D = { pente: 0.1, ordonnee: 84.2 } as const;
export const ANNEE_DEMANDEE = 2018;
export const SEUIL_DE_L_ANNALE = 86;

export interface Ajustement {
  readonly moyenneX: number;
  readonly moyenneY: number;
  readonly pente: number;
  readonly ordonnee: number;
  readonly correlation: number;
}

type FormuleSurDeuxPlages = (plageX: string, plageY: string) => string;

function valeurDuTableur(
  x: AuMoinsUn<number>,
  y: AuMoinsUn<number>,
  formule: FormuleSurDeuxPlages,
): number {
  const derniere = x.length;
  const feuille = {
    lignes: derniere + 1,
    colonnes: 3,
    cellules: {
      ...colonneDeValeurs('A', x, 1),
      ...colonneDeValeurs('B', y, 1),
      C1: formule(`A1:A${derniere}`, `B1:B${derniere}`),
    },
  };
  const { valeur } = evaluerCellule(feuille, 'C1');
  if (typeof valeur !== 'number') {
    throw new RangeError(`le tableur ne calcule pas ${feuille.cellules.C1}`);
  }
  return valeur;
}

function ajustementDe(x: readonly number[], y: readonly number[]): Ajustement {
  const abscisses = exigerAuMoinsUn([...x], 'un ajustement sans abscisse');
  const ordonnees = exigerAuMoinsUn([...y], 'un ajustement sans ordonnée');
  const calculer = (formule: FormuleSurDeuxPlages): number =>
    valeurDuTableur(abscisses, ordonnees, formule);
  return {
    moyenneX: calculer((plageX) => `=MOYENNE(${plageX})`),
    moyenneY: calculer((_, plageY) => `=MOYENNE(${plageY})`),
    pente: calculer((plageX, plageY) => `=PENTE(${plageY};${plageX})`),
    ordonnee: calculer(
      (plageX, plageY) => `=ORDONNEE.ORIGINE(${plageY};${plageX})`,
    ),
    correlation: calculer(
      (plageX, plageY) => `=COEFFICIENT.CORRELATION(${plageX};${plageY})`,
    ),
  };
}

export const AJUSTEMENT_DU_SITE = ajustementDe(BUDGETS_DU_SITE, CA_DU_SITE);
const SITE_INVERSE = ajustementDe(CA_DU_SITE, BUDGETS_DU_SITE);
export const AJUSTEMENT_A_LA_TEMPERATURE = ajustementDe(
  TEMPERATURES_DE_NANTES,
  CA_DE_NANTES,
);
const TEMPERATURE_INVERSEE = ajustementDe(CA_DE_NANTES, TEMPERATURES_DE_NANTES);
export const AJUSTEMENT_AUX_SOIREES = ajustementDe(
  SOIREES_DE_NANTES,
  CA_DE_NANTES,
);
const SANS_DOLLAR = ajustementDe(SOIREES_DE_NANTES, TEMPERATURES_DE_NANTES);
export const AJUSTEMENT_DES_CHOCOLATS = ajustementDe(
  CHOCOLATS_CHAUDS,
  JEUX_VENDUS,
);
export const AJUSTEMENT_D_ANGERS = ajustementDe(SOIREES_D_ANGERS, CA_D_ANGERS);
export const CAFES_ET_TEMPERATURE = ajustementDe(
  TEMPERATURES_DE_TOURS,
  CAFES_DE_TOURS,
);
export const CAFES_ET_MATCHS = ajustementDe(MATCHS_DE_TOURS, CAFES_DE_TOURS);
const RANGS_DE_L_ANNALE = ESPERANCES_DE_VIE.map((_, rang) => rang);
export const AJUSTEMENT_DE_L_ANNALE = ajustementDe(
  RANGS_DE_L_ANNALE,
  ESPERANCES_DE_VIE,
);
export const ANNALE_INVERSEE = ajustementDe(
  ESPERANCES_DE_VIE,
  RANGS_DE_L_ANNALE,
);

type PiegeDeCellule = readonly [number, ConfusionId];

const DERNIERE_LIGNE = BUDGETS_DU_SITE.length + 1;
const plage = (colonne: string, figee = false): string =>
  figee
    ? `$${colonne}$2:$${colonne}$${DERNIERE_LIGNE}`
    : `${colonne}2:${colonne}${DERNIERE_LIGNE}`;

const CELLULES_DE_L_AJUSTEMENT = {
  A1: 'Mois',
  B1: 'Budget pub (€)',
  C1: 'CA du site (€)',
  D1: 'Résultat',
  E1: 'Site web',
  ...colonneDeValeurs('A', MOIS_OBSERVES),
  ...colonneDeValeurs('B', BUDGETS_DU_SITE),
  ...colonneDeValeurs('C', CA_DU_SITE),
  ...colonneDeValeurs('D', ['x̄ (€)', 'ȳ (€)', 'a', 'b']),
};

const FORMULES_DE_L_AJUSTEMENT = [
  `=MOYENNE(${plage('B')})`,
  `=MOYENNE(${plage('C')})`,
  `=ARRONDI(PENTE(${plage('C')};${plage('B')});2)`,
  `=ARRONDI(ORDONNEE.ORIGINE(${plage('C')};${plage('B')});2)`,
] as const;

export const FEUILLE_DE_L_AJUSTEMENT = {
  formules: FORMULES_DE_L_AJUSTEMENT,
  attendus: exigerAuMoinsUn(
    [
      moteur.attendu(
        'E2',
        FORMULES_DE_L_AJUSTEMENT[0],
        AJUSTEMENT_DU_SITE.moyenneX,
        'references',
        [
          [AJUSTEMENT_DU_SITE.moyenneY, POINT_MOYEN_CONFONDU],
          [somme(BUDGETS_DU_SITE), POINT_MOYEN_CONFONDU],
        ],
        null,
        moteur.TOLERANCE_NULLE,
      ),
      moteur.attendu(
        'E3',
        FORMULES_DE_L_AJUSTEMENT[1],
        AJUSTEMENT_DU_SITE.moyenneY,
        'references',
        [[AJUSTEMENT_DU_SITE.moyenneX, POINT_MOYEN_CONFONDU]],
        null,
        moteur.TOLERANCE_NULLE,
      ),
      moteur.attendu(
        'E4',
        FORMULES_DE_L_AJUSTEMENT[2],
        auCentime(AJUSTEMENT_DU_SITE.pente),
        'references',
        [
          [auCentime(SITE_INVERSE.pente), PENTE_INVERSEE],
          ...piegeDeLArrondi(AJUSTEMENT_DU_SITE.pente, 2),
        ],
        null,
        moteur.TOLERANCE_NULLE,
      ),
      moteur.attendu(
        'E5',
        FORMULES_DE_L_AJUSTEMENT[3],
        auCentime(AJUSTEMENT_DU_SITE.ordonnee),
        'references',
        [
          [auCentime(SITE_INVERSE.ordonnee), PENTE_INVERSEE],
          ...piegeDeLArrondi(AJUSTEMENT_DU_SITE.ordonnee, 2),
        ],
        null,
        moteur.TOLERANCE_NULLE,
      ),
    ],
    'la feuille d’ajustement attend au moins une cellule',
  ),
  plan: {
    id: 'b1-04-a1-tableur-ajustement',
    intitule: 'Exercice 1 — L’ajustement du site web au tableur',
    lignes: DERNIERE_LIGNE,
    colonnes: 5,
    cellules: CELLULES_DE_L_AJUSTEMENT,
    verrouillees: Object.keys(CELLULES_DE_L_AJUSTEMENT),
    consignes: [
      'Données fictives Partie Libre : le budget de publicité du site web en B, son chiffre d’affaires en C, de janvier à octobre 2026.',
      'En E2 et E3, calculez les coordonnées du point moyen G avec MOYENNE.',
      'En E4 et E5, calculez a et b avec PENTE et ORDONNEE.ORIGINE, la plage des y d’abord, arrondis au centième avec ARRONDI.',
    ],
  },
};

const CELLULES_DE_LA_CORRELATION = {
  A1: 'Mois',
  B1: 'CA de Nantes (k€)',
  C1: 'Température (°C)',
  D1: 'Soirées jeux',
  E1: 'Résultat',
  F1: 'Température',
  G1: 'Soirées jeux',
  ...colonneDeValeurs('A', MOIS_OBSERVES),
  ...colonneDeValeurs('B', CA_DE_NANTES),
  ...colonneDeValeurs('C', TEMPERATURES_DE_NANTES),
  ...colonneDeValeurs('D', SOIREES_DE_NANTES),
  ...colonneDeValeurs('E', ['r', 'a', 'b']),
};

interface LigneDeLaCorrelation {
  readonly formule: string;
  readonly valeur: (ajustement: Ajustement) => number;
  readonly piegesDuModele: readonly PiegeDeCellule[];
}

const LIGNES_DE_LA_CORRELATION: readonly LigneDeLaCorrelation[] = [
  {
    formule: `=ARRONDI(COEFFICIENT.CORRELATION(${plage('C')};${plage('B', true)});3)`,
    valeur: ({ correlation }) => auMillieme(correlation),
    piegesDuModele: piegeDeLArrondi(AJUSTEMENT_A_LA_TEMPERATURE.correlation, 3),
  },
  {
    formule: `=ARRONDI(PENTE(${plage('B', true)};${plage('C')});2)`,
    valeur: ({ pente }) => auCentime(pente),
    piegesDuModele: [[auCentime(TEMPERATURE_INVERSEE.pente), PENTE_INVERSEE]],
  },
  {
    formule: `=ARRONDI(ORDONNEE.ORIGINE(${plage('B', true)};${plage('C')});2)`,
    valeur: ({ ordonnee }) => auCentime(ordonnee),
    piegesDuModele: [
      [auCentime(TEMPERATURE_INVERSEE.ordonnee), PENTE_INVERSEE],
    ],
  },
];

const PIEGES_SANS_DOLLAR: readonly (readonly PiegeDeCellule[])[] = [
  [[auMillieme(SANS_DOLLAR.correlation), NON_FIGEE]],
  [[auCentime(SANS_DOLLAR.pente), NON_FIGEE]],
  [[auCentime(SANS_DOLLAR.ordonnee), NON_FIGEE]],
];

export const FEUILLE_DE_LA_CORRELATION = {
  formules: LIGNES_DE_LA_CORRELATION.map(({ formule }) => formule),
  attendus: exigerAuMoinsUn(
    LIGNES_DE_LA_CORRELATION.flatMap(
      ({ formule, valeur, piegesDuModele }, rang) =>
        ligneRecopiee(
          {
            colonne: 'F',
            premiereLigne: 2 + rang,
            formule,
            piegesDuModele,
            piegesDeLaRecopie: PIEGES_SANS_DOLLAR[rang],
            tolerance: moteur.TOLERANCE_NULLE,
          },
          [valeur(AJUSTEMENT_A_LA_TEMPERATURE), valeur(AJUSTEMENT_AUX_SOIREES)],
        ),
    ),
    'la feuille de corrélation attend au moins une cellule',
  ),
  plan: {
    id: 'b1-04-a2-tableur-correlation',
    intitule: 'Exercice 2 — Deux ajustements pour Nantes',
    lignes: DERNIERE_LIGNE,
    colonnes: 7,
    cellules: CELLULES_DE_LA_CORRELATION,
    verrouillees: Object.keys(CELLULES_DE_LA_CORRELATION),
    consignes: [
      'Données fictives Partie Libre : le chiffre d’affaires de la boutique de Nantes en B, la température moyenne du mois en C, le nombre de soirées jeux en D.',
      'En F2, F3 et F4, calculez r, a et b de l’ajustement du CA à la température, arrondis au millième pour r et au centième pour a et b, en figeant la plage du CA par $.',
      `Recopiez chaque formule en G pour les soirées : ${gesteDeRecopieVersLaDroite('F2', 'G')}, puis de même depuis F3 et F4.`,
    ],
  },
};

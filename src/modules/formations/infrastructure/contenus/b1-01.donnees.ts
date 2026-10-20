import type { ConceptId } from '../../domain/cours/banque/concepts';
import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import { somme } from '../../../../common/domain/nombres/statistiques';
import {
  arrondi,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import * as moteur from './briques';
import {
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  type AttenduDeFeuille,
} from './feuilles';

export const CONCEPTS_DU_COURS = [
  'proportion',
  'pourcentage',
  'moyenne-ponderee',
  'point-de-pourcentage',
  'taux-evolution',
  'tableur',
  'contrat-de-lecture',
] as const satisfies readonly ConceptId[];

export const CONCEPTS_DES_PROPORTIONS = [
  'proportion',
  'pourcentage',
  'moyenne-ponderee',
  'point-de-pourcentage',
  'tableur',
] as const satisfies readonly ConceptId[];

export const BASE_INVERSEE = 'base-inversee';
export const FACTEUR_CENT = 'taux-valeur-facteur-cent';
export const VALEUR_POUR_TAUX = 'valeur-confondue-avec-taux';
export const MAUVAIS_TOUT = 'population-reference-ignoree';
export const NON_FIGEE = 'reference-relative-non-figee';
export const ARRONDI_OUBLIE = 'arrondi-oublie';
export const ADDITIF = 'raisonnement-additif';
export const MOYENNE_SIMPLE = 'moyenne-simple-des-taux';
export const POINTS_POUR_POURCENTAGE = 'points-confondus-avec-pourcentage';
export const PART_POUR_EVOLUTION = 'proportion-confondue-avec-evolution';
export const MARQUE_POUR_MARGE = 'marque-confondue-avec-marge';

export const UNE_DECIMALE = { type: 'decimales', valeur: 1 } as const;

export const DONNEES_FICTIVES =
  'Données fictives Partie Libre, créées pour ce cours.';

export const RENVOI_AU_DOSSIER = 'B1-01-A1-04-DOSSIER';
export const RENVOI_AU_FESTIVAL = 'B1-01-A4-01-SITUATION-FESTIVAL';

export const SALARIES = 40;
export const ALTERNANTS = 10;
export const SALARIES_DE_NANTES = 16;
export const ALTERNANTS_DE_NANTES = 4;
export const OBJECTIF_D_ALTERNANCE = 0.3;

export const BOUTIQUES = ['Nantes', 'Angers', 'Tours', 'Le Mans'] as const;
export const CLIENTS = [1200, 800, 600, 400] as const;
export const TAUX_DE_LA_CARTE = [45, 60, 50, 75] as const;
export const RESERVATION_EN_LIGNE = 0.4;

export const CLIENTS_D_OCTOBRE = [1500, 500] as const;
export const TAUX_D_OCTOBRE = [0.4, 0.7] as const;

export const PART_DES_JEUNES_2025 = 36.5;
export const PART_DES_JEUNES_2026 = 42.3;
export const ECART_DES_JEUNES = auMillionieme(
  PART_DES_JEUNES_2026 - PART_DES_JEUNES_2025,
);
export const ACHAT_DE_LA_MANETTE = 24;
export const VENTE_DE_LA_MANETTE = 39;

export const BILLETS = [412, 288, 172, 88] as const;
const CATEGORIES_DE_BILLETS = [
  'Plein tarif',
  'Étudiant',
  'Enfant',
  'Pass famille',
] as const;
export const BILLETS_EN_LIGNE = 150;
export const OPTION_TOURNOI = 0.45;
export const ATELIERS = [
  [160, 0.85],
  [140, 0.6],
] as const;
export const ACHAT_AU_STAND = 32;
export const VENTE_AU_STAND = 50;

export const enPourcentage = (partie: number, tout: number): number =>
  auMillionieme((partie / tout) * 100);
export const partArrondie = (partie: number, tout: number): number =>
  arrondi((partie / tout) * 100, 1);

function piegeDeLArrondi(
  partie: number,
  tout: number,
): (readonly [number, typeof ARRONDI_OUBLIE])[] {
  const exacte = enPourcentage(partie, tout);
  return exacte === partArrondie(partie, tout)
    ? []
    : [[exacte, ARRONDI_OUBLIE]];
}

export const TOTAL_DES_CLIENTS = somme(CLIENTS);
const PORTEURS = CLIENTS.map((clients, rang) =>
  auMillionieme((clients * TAUX_DE_LA_CARTE[rang]) / 100),
);
export const TOTAL_DES_PORTEURS = somme(PORTEURS);
export const TOTAL_DES_BILLETS = somme(BILLETS);

export const FORMULE_DU_TOTAL_DES_CLIENTS = '=SOMME(B2:B5)';
export const FORMULE_DE_LA_PART_DES_CLIENTS = '=ARRONDI(B2/$B$6*100;1)';
export const FORMULE_DU_CONTROLE_DES_CLIENTS = '=SOMME(C2:C5)';

const CELLULES_DES_CLIENTS = {
  A1: 'Boutique',
  B1: 'Clients en septembre',
  C1: 'Part des clients (%)',
  A6: 'Total',
  ...colonneDeValeurs('A', BOUTIQUES),
  ...colonneDeValeurs('B', CLIENTS),
};

export const PLAN_DES_CLIENTS = {
  id: 'b1-01-a1-tableur-clients',
  intitule: 'Exercice 2 — La répartition des clients au tableur',
  lignes: 6,
  colonnes: 3,
  cellules: CELLULES_DES_CLIENTS,
  verrouillees: Object.keys(CELLULES_DES_CLIENTS),
  consignes: [
    'En B6, calculez le total des clients.',
    `En C2, écrivez la part des clients de Nantes, en %, arrondie au dixième avec ARRONDI. Recopiez jusqu’en C5 : ${gesteDeRecopie(['C2'], 5)}.`,
    'En C6, vérifiez que les parts font 100 %.',
    'Le total ne s’écrit pas dans la formule : utilisez B6, figé par des $.',
  ],
};

export const ATTENDUS_DES_CLIENTS: AuMoinsUnModifiable<AttenduDeFeuille> = [
  moteur.attendu(
    'B6',
    FORMULE_DU_TOTAL_DES_CLIENTS,
    TOTAL_DES_CLIENTS,
    'references',
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 2,
      formule: FORMULE_DE_LA_PART_DES_CLIENTS,
      piegesDuModele: [
        [arrondi(CLIENTS[0] / TOTAL_DES_CLIENTS, 1), FACTEUR_CENT],
        [enPourcentage(TOTAL_DES_CLIENTS, CLIENTS[0]), BASE_INVERSEE],
      ],
      piegesDuRang: (rang) => piegeDeLArrondi(CLIENTS[rang], TOTAL_DES_CLIENTS),
      confusionSiErreur: NON_FIGEE,
    },
    [
      partArrondie(CLIENTS[0], TOTAL_DES_CLIENTS),
      partArrondie(CLIENTS[1], TOTAL_DES_CLIENTS),
      partArrondie(CLIENTS[2], TOTAL_DES_CLIENTS),
      partArrondie(CLIENTS[3], TOTAL_DES_CLIENTS),
    ],
  ),
  moteur.attendu('C6', FORMULE_DU_CONTROLE_DES_CLIENTS, 100, 'references'),
];

export const FORMULE_DU_TOTAL_DES_BILLETS = '=SOMME(B3:B6)';
export const FORMULE_DE_LA_PART_DES_BILLETS = '=ARRONDI(B3/$B$7*100;1)';
export const FORMULE_DU_CONTROLE_DES_BILLETS = '=SOMME(C3:C6)';

const CELLULES_DES_BILLETS = {
  A1: 'Billets du Week-end du jeu',
  A2: 'Catégorie',
  B2: 'Billets vendus',
  C2: 'Part des billets (%)',
  A7: 'Total',
  ...Object.fromEntries(
    CATEGORIES_DE_BILLETS.map((categorie, rang) => [`A${rang + 3}`, categorie]),
  ),
  ...Object.fromEntries(
    BILLETS.map((billets, rang) => [`B${rang + 3}`, String(billets)]),
  ),
};

export const PLAN_DES_BILLETS = {
  id: 'b1-01-a4-feuille-billets',
  intitule: 'Question tableur (3 points) — La répartition des billets',
  lignes: 7,
  colonnes: 3,
  cellules: CELLULES_DES_BILLETS,
  verrouillees: Object.keys(CELLULES_DES_BILLETS),
  consignes: [
    'En B7, calculez le nombre total de billets.',
    `En C3, écrivez la formule de la part des billets plein tarif, en %, arrondie au dixième, à recopier vers le bas. Recopiez jusqu’en C6 : ${gesteDeRecopie(['C3'], 6)}.`,
    'En C7, vérifiez que les parts font 100 %.',
    'Le total ne s’écrit pas dans la formule : utilisez B7, figé par des $.',
  ],
};

export const ATTENDUS_DES_BILLETS: AuMoinsUnModifiable<AttenduDeFeuille> = [
  moteur.attendu(
    'B7',
    FORMULE_DU_TOTAL_DES_BILLETS,
    TOTAL_DES_BILLETS,
    'references',
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 3,
      formule: FORMULE_DE_LA_PART_DES_BILLETS,
      piegesDuModele: [
        [arrondi(BILLETS[0] / TOTAL_DES_BILLETS, 1), FACTEUR_CENT],
        [auMillionieme(BILLETS[0] / TOTAL_DES_BILLETS), FACTEUR_CENT],
        [arrondi((TOTAL_DES_BILLETS / BILLETS[0]) * 100, 1), BASE_INVERSEE],
        ...piegeDeLArrondi(BILLETS[0], TOTAL_DES_BILLETS),
      ],
      piegesDuRang: (rang) => piegeDeLArrondi(BILLETS[rang], TOTAL_DES_BILLETS),
      confusionSiErreur: NON_FIGEE,
    },
    [
      partArrondie(BILLETS[0], TOTAL_DES_BILLETS),
      partArrondie(BILLETS[1], TOTAL_DES_BILLETS),
      partArrondie(BILLETS[2], TOTAL_DES_BILLETS),
      partArrondie(BILLETS[3], TOTAL_DES_BILLETS),
    ],
  ),
  moteur.attendu('C7', FORMULE_DU_CONTROLE_DES_BILLETS, 100, 'references'),
];

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

export const [PREMIERS_PORTEURS, ...AUTRES_PORTEURS] = PORTEURS.map(
  (porteurs, rang): AttenduDeTableau => ({
    rang,
    cle: 'porteurs',
    valeur: porteurs,
    pieges: [
      { valeur: TAUX_DE_LA_CARTE[rang], confusion: VALEUR_POUR_TAUX },
      {
        valeur: auMillionieme(CLIENTS[rang] / (TAUX_DE_LA_CARTE[rang] / 100)),
        confusion: BASE_INVERSEE,
      },
    ],
  }),
);

export const PARCOURS_DU_COFFRE = 'b1-01-a4-coffre-festival';

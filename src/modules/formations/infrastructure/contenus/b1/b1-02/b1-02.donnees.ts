import { somme } from '../../../../../../common/domain/nombres/statistiques';
import {
  arrondi,
  auMillionieme,
} from '../../../../../../common/domain/nombres/arrondi';
import type { AuMoinsUnModifiable } from '../../../../../../common/domain/objets/au-moins-un';
import type { ConceptId } from '../../../../domain/cours/banque/concepts';
import type { ConfusionId } from '../../../../domain/cours/banque/confusions';
import { BOUTIQUES, FACTEUR_CENT } from '../b1-01/b1-01.donnees';
import * as moteur from '../../briques';
import {
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  gesteDeRecopieVersLaDroite,
  ligneRecopiee,
  piegeDeLArrondi,
} from '../../feuilles';

export const CONCEPTS_DU_COURS = [
  'taux-evolution',
  'coefficient-multiplicateur',
  'evolutions-successives',
  'evolution-reciproque',
  'indice-base-100',
  'taux-moyen',
  'pourcentage',
  'tableur',
] as const satisfies readonly ConceptId[];

export const ECART = 'ecart-absolu-au-lieu-du-taux';
export const BASE_ARRIVEE = 'base-arrivee';
export const COEFFICIENT_POUR_TAUX = 'coefficient-confondu-avec-taux';
export const SENS = 'sens-de-variation';
export const TVA_SUR_TTC = 'tva-calculee-sur-ttc';
export const TAUX_ADDITIONNES = 'taux-successifs-additionnes';
export const SYMETRIE = 'hausse-baisse-symetriques';
export const GLOBAL_MAL_LU = 'coefficient-global-mal-interprete';
export const MEME_TAUX_AU_RETOUR = 'reciproque-meme-taux';
export const INDICE_POUR_TAUX = 'indice-lu-comme-taux';
export const INDICE_POUR_VALEUR = 'indice-lu-comme-valeur';
export const TAUX_MOYEN_DIVISE = 'taux-moyen-arithmetique';
export const NON_FIGEE_EN_LIGNE = 'reference-non-figee-en-ligne';

export const RENVOI_AU_DOSSIER = 'B1-02-A1-04-DOSSIER';

export const PACK_AVANT = 16;
export const PACK_APRES = 18;
export const MANETTE_TTC = 60;
export const TVA = 0.2;
export const REMISE_DE_LA_CARTE = 0.15;
export const HAUSSE_DE_2026 = 0.1;
export const HAUSSE_DE_2027 = 0.05;
export const BAISSE_DES_CARTES = 0.4;

export const COEFFICIENT_GLOBAL = auMillionieme(
  (1 + HAUSSE_DE_2026) * (1 + HAUSSE_DE_2027),
);
const evolutionExacte = (depart: number, arrivee: number): number =>
  ((arrivee - depart) / depart) * 100;

const auDixieme = (valeur: number): number => arrondi(valeur, 1);

const CA_2025 = [184, 120, 96, 80] as const;
const CA_2026 = [207, 123, 92, 94] as const;
const TOTAL_2025 = somme(CA_2025);
const TOTAL_2026 = somme(CA_2026);

export const CA_DES_BOUTIQUES = BOUTIQUES.map(
  (boutique, rang) => `${boutique} ${CA_2025[rang]} puis ${CA_2026[rang]}`,
).join(', ');

const DEPARTS = [...CA_2025, TOTAL_2025];
const ARRIVEES = [...CA_2026, TOTAL_2026];

const CELLULES_DU_CA = {
  A1: 'Boutique',
  B1: 'CA 2025 (k€)',
  C1: 'CA 2026 (k€)',
  D1: 'Taux d’évolution (%)',
  A6: 'Total',
  ...colonneDeValeurs('A', BOUTIQUES),
  ...colonneDeValeurs('B', CA_2025),
  ...colonneDeValeurs('C', CA_2026),
};

const FORMULE_DU_TAUX = '=ARRONDI((C2-B2)/B2*100;1)';
const [TAUX_DE_NANTES, ...AUTRES_TAUX] = DEPARTS.map((depart, rang) =>
  auDixieme(evolutionExacte(depart, ARRIVEES[rang])),
);

export const EVOLUTION_DU_CA = {
  formules: { taux: FORMULE_DU_TAUX },
  attendus: [
    moteur.attendu('B6', '=SOMME(B2:B5)', TOTAL_2025, 'references'),
    moteur.attendu('C6', '=SOMME(C2:C5)', TOTAL_2026, 'references'),
    ...colonneRecopiee(
      {
        colonne: 'D',
        premiereLigne: 2,
        formule: FORMULE_DU_TAUX,
        piegesDuModele: [
          [
            auDixieme(((ARRIVEES[0] - DEPARTS[0]) / ARRIVEES[0]) * 100),
            BASE_ARRIVEE,
          ],
          [ARRIVEES[0] - DEPARTS[0], ECART],
          [auDixieme((ARRIVEES[0] / DEPARTS[0]) * 100), COEFFICIENT_POUR_TAUX],
        ],
        piegesDuRang: (rang) =>
          piegeDeLArrondi(evolutionExacte(DEPARTS[rang], ARRIVEES[rang])),
        tolerance: moteur.TOLERANCE_NULLE,
      },
      [TAUX_DE_NANTES, ...AUTRES_TAUX],
    ),
  ] satisfies AuMoinsUnModifiable<ReturnType<typeof moteur.attendu>>,
  plan: {
    id: 'b1-02-a1-tableur-ca',
    intitule: 'Exercice 2 — L’évolution du chiffre d’affaires au tableur',
    lignes: 6,
    colonnes: 4,
    cellules: CELLULES_DU_CA,
    verrouillees: Object.keys(CELLULES_DU_CA),
    consignes: [
      'En B6 et C6, calculez le chiffre d’affaires total de chaque année.',
      `En D2, écrivez le taux d’évolution de Nantes, en %, arrondi au dixième avec ARRONDI. Recopiez jusqu’en D6 : ${gesteDeRecopie(['D2'], 6)}.`,
    ],
  },
};

type Piege = readonly [number, ConfusionId];

const SANCTIONS = [18, 21, 42, 87] as const;
const [SANCTIONS_2021, SANCTIONS_2022, , SANCTIONS_2024] = SANCTIONS;
const EVOLUTIONS_DE_2021_A_2024 = 3;

const indiceExact = (sanctions: number): number =>
  (sanctions / SANCTIONS_2021) * 100;
const [INDICE_2022, INDICE_2023, INDICE_2024] = SANCTIONS.slice(1).map(
  (sanctions) => auDixieme(indiceExact(sanctions)),
);

const TAUX_2022_2024 = evolutionExacte(SANCTIONS_2022, SANCTIONS_2024);
const HAUSSE_2021_2024 = evolutionExacte(SANCTIONS_2021, SANCTIONS_2024);
const COEFFICIENT_MOYEN =
  (SANCTIONS_2024 / SANCTIONS_2021) ** (1 / EVOLUTIONS_DE_2021_A_2024);
const TAUX_MOYEN = (COEFFICIENT_MOYEN - 1) * 100;

const FORMULES_DE_L_ANNALE = {
  indice: '=ARRONDI(C2/$B$2*100;1)',
  taux: '=ARRONDI((E2-C2)/C2*100;1)',
  hausse: '=ARRONDI((E2-B2)/B2*100;1)',
  moyen: '=ARRONDI((PUISSANCE(E2/B2;1/3)-1)*100;1)',
};

const piegesDeLaRecopie = (rang: number): readonly Piege[] => {
  const baseGlissee = auDixieme((SANCTIONS[rang + 1] / SANCTIONS[rang]) * 100);
  return [
    [baseGlissee, NON_FIGEE_EN_LIGNE],
    ...piegeDeLArrondi(indiceExact(SANCTIONS[rang + 1])),
  ];
};

const CELLULES_DU_SUJET = {
  A1: 'Année',
  B1: '2021',
  C1: '2022',
  D1: '2023',
  E1: '2024',
  A2: 'Sanctions prononcées',
  B2: String(SANCTIONS[0]),
  C2: String(SANCTIONS[1]),
  D2: String(SANCTIONS[2]),
  E2: String(SANCTIONS[3]),
  A3: 'Indices (base 100 en 2021)',
  B3: '100',
  A5: 'Taux 2022-2024 (%)',
  A6: 'Hausse 2021-2024 (%)',
  A7: 'Taux annuel moyen (%)',
};

export const SANCTIONS_DE_LA_CNIL = {
  formules: FORMULES_DE_L_ANNALE,
  attendus: [
    ...ligneRecopiee(
      {
        colonne: 'C',
        premiereLigne: 3,
        formule: FORMULES_DE_L_ANNALE.indice,
        piegesDuModele: [
          ...piegeDeLArrondi(indiceExact(SANCTIONS_2022)),
          [auDixieme(SANCTIONS_2022 / SANCTIONS_2021), FACTEUR_CENT],
        ],
        piegesDuRang: piegesDeLaRecopie,
        confusionSiErreur: NON_FIGEE_EN_LIGNE,
        tolerance: moteur.TOLERANCE_NULLE,
      },
      [INDICE_2022, INDICE_2023, INDICE_2024],
    ),
    moteur.attendu(
      'B5',
      FORMULES_DE_L_ANNALE.taux,
      auDixieme(TAUX_2022_2024),
      'references',
      [
        ...piegeDeLArrondi(TAUX_2022_2024),
        [SANCTIONS_2024 - SANCTIONS_2022, ECART],
        [
          auDixieme(((SANCTIONS_2024 - SANCTIONS_2022) / SANCTIONS_2024) * 100),
          BASE_ARRIVEE,
        ],
      ],
      null,
      moteur.TOLERANCE_NULLE,
    ),
    moteur.attendu(
      'B6',
      FORMULES_DE_L_ANNALE.hausse,
      auDixieme(HAUSSE_2021_2024),
      'references',
      [
        ...piegeDeLArrondi(HAUSSE_2021_2024),
        [auDixieme(indiceExact(SANCTIONS_2024)), INDICE_POUR_TAUX],
        [SANCTIONS_2024 - SANCTIONS_2021, ECART],
      ],
      null,
      moteur.TOLERANCE_NULLE,
    ),
    moteur.attendu(
      'B7',
      FORMULES_DE_L_ANNALE.moyen,
      auDixieme(TAUX_MOYEN),
      'references',
      [
        ...piegeDeLArrondi(TAUX_MOYEN),
        [
          auDixieme(HAUSSE_2021_2024 / EVOLUTIONS_DE_2021_A_2024),
          TAUX_MOYEN_DIVISE,
        ],
        [auDixieme(COEFFICIENT_MOYEN - 1), FACTEUR_CENT],
        [auDixieme(COEFFICIENT_MOYEN), COEFFICIENT_POUR_TAUX],
      ],
      null,
      moteur.TOLERANCE_NULLE,
    ),
  ] satisfies AuMoinsUnModifiable<ReturnType<typeof moteur.attendu>>,
  plan: {
    id: 'b1-02-a3-tableur-cnil',
    intitule: 'Exercice 5 — Les sanctions de la CNIL',
    lignes: 7,
    colonnes: 5,
    cellules: CELLULES_DU_SUJET,
    verrouillees: Object.keys(CELLULES_DU_SUJET),
    consignes: [
      'Données réelles : CNIL, rapport annuel 2024. Tableau du sujet de BTS CG 2026, Polynésie (26CGMATPO).',
      `En C3, écrivez l’indice de 2022, base 100 en 2021, arrondi au dixième avec ARRONDI. Recopiez jusqu’en E3 : ${gesteDeRecopieVersLaDroite('C3', 'E')}.`,
      'La valeur de 2021 ne s’écrit pas dans la formule : utilisez B2, figée par des $.',
      'En B5, calculez le taux d’évolution des sanctions entre 2022 et 2024, en %, arrondi au dixième avec ARRONDI.',
      'En B6, calculez la hausse des sanctions entre 2021 et 2024, en %, arrondie au dixième avec ARRONDI.',
      'En B7, calculez le taux annuel moyen entre 2021 et 2024, en %, arrondi au dixième avec ARRONDI et PUISSANCE.',
    ],
  },
};

const HAUSSE_DU_TABLEAU = 0.2;
const SOLDES_DU_TABLEAU = 0.25;
const EVOLUTION_ADDITIONNEE = 0.05;

export const LIBELLES_DES_PRIX = [
  'Console',
  'Manette',
  'Jeu de plateau',
  'Jeu de cartes',
] as const;
export const PRIX_DE_DEPART = [120, 80, 60, 40] as const;

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

const APRES_HAUSSE = PRIX_DE_DEPART.map((prix) =>
  auMillionieme(prix * (1 + HAUSSE_DU_TABLEAU)),
);

export const [PREMIER_PRIX, ...AUTRES_PRIX] = [
  ...PRIX_DE_DEPART.map(
    (prix, rang): AttenduDeTableau => ({
      rang,
      cle: 'hausse',
      valeur: APRES_HAUSSE[rang],
      pieges: [
        {
          valeur: auMillionieme(prix * HAUSSE_DU_TABLEAU),
          confusion: COEFFICIENT_POUR_TAUX,
        },
      ],
    }),
  ),
  ...PRIX_DE_DEPART.map(
    (prix, rang): AttenduDeTableau => ({
      rang,
      cle: 'soldes',
      valeur: auMillionieme(APRES_HAUSSE[rang] * (1 - SOLDES_DU_TABLEAU)),
      pieges: [
        {
          valeur: auMillionieme(prix * (1 - EVOLUTION_ADDITIONNEE)),
          confusion: TAUX_ADDITIONNES,
        },
        {
          valeur: auMillionieme(APRES_HAUSSE[rang] * SOLDES_DU_TABLEAU),
          confusion: COEFFICIENT_POUR_TAUX,
        },
      ],
    }),
  ),
];

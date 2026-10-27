import {
  auCentime,
  auMillionieme,
} from '../../../../common/domain/nombres/arrondi';
import type { AuMoinsUnModifiable } from '../../../../common/domain/au-moins-un';
import type { ConceptId } from '../../domain/cours/banque/concepts';
import * as moteur from './briques';
import {
  anneesEtRangs,
  avecVirgule,
  colonneDeValeurs,
  colonneRecopiee,
  gesteDeRecopie,
  termes,
  type AttenduDeFeuille,
} from './feuilles';

export const CONCEPTS_DU_COURS = [
  'interets-composes',
  'valeur-actuelle',
  'annuites',
  'tableau-d-amortissement',
  'cout-du-credit',
  'tableur',
  'suite-geometrique',
  'somme-de-termes',
  'coefficient-multiplicateur',
  'evolution-reciproque',
] as const satisfies readonly ConceptId[];

export const CONCEPTS_DES_MATHEMATIQUES_FINANCIERES = [
  'interets-composes',
  'valeur-actuelle',
  'annuites',
  'tableau-d-amortissement',
  'cout-du-credit',
  'tableur',
] as const satisfies readonly ConceptId[];

const TRESORERIE = 40000;
const TAUX_DU_PLACEMENT = 0.025;
const ANNEE_DU_PLACEMENT = 2026;
const DERNIER_RANG_DU_PLACEMENT = 5;

const VERSEMENT = 6000;
const TAUX_DE_L_EPARGNE = 0.03;
const PREMIERE_ANNEE_D_EPARGNE = 2026;
const VERSEMENTS = 5;

export const EMPRUNT = 60000;
export const TAUX_DE_L_EMPRUNT = 0.04;
export const DUREE_DE_L_EMPRUNT = 5;
export const ANNUITE_ARRONDIE = 13477.63;
export const ECART_DE_L_ANNUITE_ARRONDIE = 0.02;

const EMPRUNT_TYPE = 100000;
const TAUX_DE_L_EMPRUNT_TYPE = 0.05;
export const DUREE_DE_L_EMPRUNT_TYPE = 10;

export const NON_FIGEE = 'reference-relative-non-figee';
export const TAUX_POUR_COEFFICIENT = 'coefficient-confondu-avec-taux';
export const INTERETS_SIMPLES = 'interets-simples-au-lieu-de-composes';
export const ACTUALISATION_INVERSEE = 'actualisation-inversee';
export const SANS_INTERETS = 'versements-sans-interets';
export const TOUTE_LA_DUREE = 'versements-places-toute-la-duree';
export const CAPITAL_INITIAL = 'interets-sur-capital-initial';
export const ANNUITE_POUR_AMORTISSEMENT =
  'annuite-confondue-avec-amortissement';
export const TOTAL_REMBOURSE = 'cout-credit-confondu-avec-total-rembourse';
export const VPM_NON_SIGNE = 'capital-de-vpm-non-signe';

export const DONNEES_FICTIVES =
  'Données fictives Atelier Rivage, créées pour ce cours.';

export const RENVOI_AU_DOSSIER = 'B2-05-A1-05-DOSSIER';

const annuiteConstante = (
  capital: number,
  taux: number,
  duree: number,
): number => (capital * taux) / (1 - (1 + taux) ** -duree);

const placement = (rang: number): number =>
  auMillionieme(TRESORERIE * (1 + TAUX_DU_PLACEMENT) ** rang);
const interetsDuPlacement = (rang: number): number =>
  auMillionieme(placement(rang) - placement(rang - 1));

function epargne(rang: number): number {
  return rang === 1
    ? VERSEMENT
    : auMillionieme(epargne(rang - 1) * (1 + TAUX_DE_L_EPARGNE) + VERSEMENT);
}
const interetsDeLEpargne = (rang: number): number =>
  auMillionieme(epargne(rang - 1) * TAUX_DE_L_EPARGNE);

interface LigneDAmortissement {
  readonly capital: number;
  readonly interets: number;
  readonly amortissement: number;
}

function tableauDAmortissement(
  capital: number,
  taux: number,
  versement: number,
  duree: number,
  auPas: (valeur: number) => number,
): LigneDAmortissement[] {
  return termes((annee) => annee, 1, duree).reduce<LigneDAmortissement[]>(
    (lignes) => {
      const precedente = lignes.at(-1);
      const restant =
        precedente === undefined
          ? capital
          : auPas(precedente.capital - precedente.amortissement);
      const interets = auPas(restant * taux);
      return [
        ...lignes,
        {
          capital: restant,
          interets,
          amortissement: auPas(versement - interets),
        },
      ];
    },
    [],
  );
}

const LIGNES_DE_L_EMPRUNT = tableauDAmortissement(
  EMPRUNT,
  TAUX_DE_L_EMPRUNT,
  ANNUITE_ARRONDIE,
  DUREE_DE_L_EMPRUNT,
  auCentime,
);

export const LIGNES_DE_L_EMPRUNT_TYPE = tableauDAmortissement(
  EMPRUNT_TYPE,
  TAUX_DE_L_EMPRUNT_TYPE,
  annuiteConstante(
    EMPRUNT_TYPE,
    TAUX_DE_L_EMPRUNT_TYPE,
    DUREE_DE_L_EMPRUNT_TYPE,
  ),
  DUREE_DE_L_EMPRUNT_TYPE,
  (valeur) => valeur,
);

export const FORMULE_DU_PLACEMENT = '=C2*(1+$G$1)';
export const FORMULE_DES_INTERETS_DU_PLACEMENT = '=C3-C2';

const CELLULES_DU_PLACEMENT = {
  A1: 'Au 1er janvier',
  B1: 'Années n',
  C1: 'Valeur acquise (€)',
  C2: String(TRESORERIE),
  D1: 'Intérêts de l’année (€)',
  F1: 'Taux annuel',
  G1: avecVirgule(TAUX_DU_PLACEMENT, 3),
  ...anneesEtRangs(ANNEE_DU_PLACEMENT, DERNIER_RANG_DU_PLACEMENT),
};

export const PLAN_DU_PLACEMENT = {
  id: 'b2-05-a1-tableur-placement',
  intitule: 'Exercice 2 — Le placement au tableur',
  lignes: DERNIER_RANG_DU_PLACEMENT + 2,
  colonnes: 7,
  cellules: CELLULES_DU_PLACEMENT,
  verrouillees: Object.keys(CELLULES_DU_PLACEMENT),
  consignes: [
    `En C3, écrivez la formule qui calcule la valeur acquise au 1er janvier 2027 à partir de C2 et du taux (G1). Recopiez-la jusqu’en C7 : ${gesteDeRecopie(['C3'], 7)}.`,
    `En D3, écrivez les intérêts gagnés pendant l’année écoulée. Recopiez jusqu’en D7 : ${gesteDeRecopie(['D3'], 7)}.`,
    'Le taux ne s’écrit pas dans la formule : utilisez la cellule G1.',
  ],
};

export const ATTENDUS_DU_PLACEMENT: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 3,
      formule: FORMULE_DU_PLACEMENT,
      piegesDuModele: [[TRESORERIE * TAUX_DU_PLACEMENT, TAUX_POUR_COEFFICIENT]],
      piegesDeLaRecopie: [[placement(1), NON_FIGEE]],
    },
    termes(placement, 1, DERNIER_RANG_DU_PLACEMENT),
  ),
  ...colonneRecopiee(
    {
      colonne: 'D',
      premiereLigne: 3,
      formule: FORMULE_DES_INTERETS_DU_PLACEMENT,
      piegesDeLaRecopie: [[TRESORERIE * TAUX_DU_PLACEMENT, INTERETS_SIMPLES]],
    },
    termes(interetsDuPlacement, 1, DERNIER_RANG_DU_PLACEMENT),
  ),
];

export const FORMULE_DE_L_EPARGNE = '=B2*(1+$F$1)+$H$1';
export const FORMULE_DES_INTERETS_DE_L_EPARGNE = '=B2*$F$1';
export const FORMULE_DU_TOTAL_DES_INTERETS = '=SOMME(C3:C6)';

const CELLULES_DE_L_EPARGNE = {
  A1: 'Fin d’année',
  B1: 'Épargne disponible (€)',
  B2: String(VERSEMENT),
  C1: 'Intérêts de l’année (€)',
  E1: 'Taux annuel',
  F1: avecVirgule(TAUX_DE_L_EPARGNE, 2),
  G1: 'Versement (€)',
  H1: String(VERSEMENT),
  E3: 'Total des intérêts (€)',
  ...colonneDeValeurs(
    'A',
    termes((rang) => PREMIERE_ANNEE_D_EPARGNE + rang, 0, VERSEMENTS - 1),
  ),
};

export const PLAN_DE_L_EPARGNE = {
  id: 'b2-05-a2-tableur-epargne',
  intitule: 'Exercice 4 — L’épargne au tableur',
  lignes: VERSEMENTS + 1,
  colonnes: 8,
  cellules: CELLULES_DE_L_EPARGNE,
  verrouillees: Object.keys(CELLULES_DE_L_EPARGNE),
  consignes: [
    `B2 : le premier versement, fin 2026. En B3, écrivez l’épargne disponible fin 2027 : l’épargne de l’an passé, ses intérêts de l’année, puis le nouveau versement (H1). Recopiez jusqu’en B6 : ${gesteDeRecopie(['B3'], 6)}.`,
    `En C3, écrivez les intérêts gagnés pendant l’année. Recopiez jusqu’en C6 : ${gesteDeRecopie(['C3'], 6)}.`,
    'En F3, calculez le total des intérêts gagnés de 2027 à 2030.',
    'Le taux et le versement ne s’écrivent pas dans les formules : utilisez F1 et H1.',
  ],
};

export const ATTENDUS_DE_L_EPARGNE: AuMoinsUnModifiable<AttenduDeFeuille> = [
  ...colonneRecopiee(
    {
      colonne: 'B',
      premiereLigne: 3,
      formule: FORMULE_DE_L_EPARGNE,
      piegesDuModele: [[VERSEMENT * 2, SANS_INTERETS]],
      piegesDeLaRecopie: [[epargne(2), NON_FIGEE]],
    },
    termes(epargne, 2, VERSEMENTS),
  ),
  ...colonneRecopiee(
    {
      colonne: 'C',
      premiereLigne: 3,
      formule: FORMULE_DES_INTERETS_DE_L_EPARGNE,
      piegesDeLaRecopie: [
        [0, NON_FIGEE],
        [interetsDeLEpargne(2), INTERETS_SIMPLES],
      ],
    },
    termes(interetsDeLEpargne, 2, VERSEMENTS),
  ),
  moteur.attendu(
    'F3',
    FORMULE_DU_TOTAL_DES_INTERETS,
    auMillionieme(epargne(VERSEMENTS) - VERSEMENT * VERSEMENTS),
    'references',
    [[interetsDeLEpargne(VERSEMENTS), 'terme-pris-pour-somme']],
  ),
];

type AttenduDeTableau = Parameters<typeof moteur.questionDeTableau>[2][number];

export const [
  PREMIERE_LIGNE_D_AMORTISSEMENT,
  ...AUTRES_LIGNES_D_AMORTISSEMENT
] = LIGNES_DE_L_EMPRUNT.flatMap<AttenduDeTableau>((ligne, rang) => [
  {
    rang,
    cle: 'interets',
    valeur: ligne.interets,
    pieges:
      rang === 0
        ? []
        : [
            {
              valeur: EMPRUNT * TAUX_DE_L_EMPRUNT,
              confusion: CAPITAL_INITIAL,
            },
          ],
  },
  {
    rang,
    cle: 'amortissement',
    valeur: ligne.amortissement,
    pieges: [
      { valeur: ANNUITE_ARRONDIE, confusion: ANNUITE_POUR_AMORTISSEMENT },
    ],
  },
]);

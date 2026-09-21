import type { SheetPlanStocke } from '../../src/modules/formations/domain/contrats/cours';
import type {
  CorrigeClassement,
  CorrigeDefi,
  CorrigeEnigme,
  CorrigeFeuille,
  CorrigeRevelation,
  CorrigeTableau,
} from '../../src/modules/formations/domain/cours/Corrige';

const TOLERANCE_RELATIVE = { type: 'relative', valeur: 0.0001 } as const;

export function buildPlanFeuille(
  overrides: Partial<SheetPlanStocke> = {},
): SheetPlanStocke {
  return {
    id: 'b2-01-a4-feuille-canaux',
    intitule: 'Tâche de tableur 1 — Tableau de bord par canal, 2024–2025',
    lignes: 3,
    colonnes: 4,
    cellules: {
      A1: 'Canal',
      B1: '2024',
      C1: '2025',
      B2: '483000',
      C2: '397000',
    },
    verrouillees: ['A1', 'B1', 'C1', 'B2', 'C2'],
    consignes: ['En D2, écrivez le taux d’évolution du CA du sur-mesure.'],
    ...overrides,
  };
}

export function buildCorrigeFeuille(
  overrides: Partial<CorrigeFeuille> = {},
): CorrigeFeuille {
  return {
    type: 'feuille',
    plan: buildPlanFeuille(),
    attendus: [
      {
        reference: 'D2',
        formuleReference: '=(C2-B2)/B2',
        valeur: -0.178054,
        tolerance: TOLERANCE_RELATIVE,
        forme: 'references',
        confusionSiErreurFormule: null,
        pieges: [
          { valeur: -17.805383, confusion: 'taux-valeur-facteur-cent' },
          { valeur: -0.216625, confusion: 'base-arrivee' },
        ],
      },
      {
        reference: 'D3',
        formuleReference: '=(C3-B3)/B3',
        valeur: 0.095238,
        tolerance: TOLERANCE_RELATIVE,
        forme: { memeQue: 'D2' },
        confusionSiErreurFormule: null,
        pieges: [],
      },
    ],
    seuilReussite: 0.8,
    ...overrides,
  };
}

export function buildCorrigeTableau(
  overrides: Partial<CorrigeTableau> = {},
): CorrigeTableau {
  return {
    type: 'tableau',
    attendus: [
      {
        rang: 0,
        cle: 'prix',
        valeur: 21.6,
        pieges: [],
      },
      {
        rang: 1,
        cle: 'prix',
        valeur: 20.52,
        pieges: [{ valeur: 20.6, confusion: 'taux-successifs-additionnes' }],
      },
    ],
    tolerance: { type: 'absolue', valeur: 0.01 },
    seuilReussite: 0.75,
    ...overrides,
  };
}

export function buildCorrigeClassement(
  overrides: Partial<CorrigeClassement> = {},
): CorrigeClassement {
  return {
    type: 'classement',
    attendus: [
      {
        carteId: 'ca-2025',
        categorieId: 'valeur',
        confusionSiErreur: 'valeur-confondue-avec-taux',
        justification: 'montant en euros : « combien ? »',
      },
      {
        carteId: 'inflation',
        categorieId: 'ambigu',
        confusionSiErreur: 'unite-manquante-ignoree',
        justification: 'ni unité, ni période, ni source',
      },
    ],
    seuilReussite: 0.75,
    ...overrides,
  };
}

export function buildCorrigeEnigme(
  overrides: Partial<CorrigeEnigme> = {},
): CorrigeEnigme {
  return {
    type: 'enigme',
    parcoursId: 'b2-01-a6-coffre',
    enigmeId: 'b2-01-a6-e1-mix',
    rang: 0,
    solution: {
      type: 'nombre',
      valeur: 23.4,
      tolerance: { type: 'absolue', valeur: 0.05 },
      formePubliee: '23,4',
    },
    fragment: 'K7',
    pieges: [{ valeur: 26.666667, confusion: 'moyenne-simple-des-taux' }],
    ...overrides,
  };
}

export function buildCorrigeDefi(
  overrides: Partial<CorrigeDefi> = {},
): CorrigeDefi {
  return {
    type: 'defi',
    strategies: [
      {
        id: 'axe',
        libelle:
          'Lire l’origine et l’amplitude de l’axe vertical avant de comparer les hauteurs.',
        fausse: false,
      },
      {
        id: 'couleur',
        libelle:
          'Changer la couleur des barres pour rendre le graphique plus neutre.',
        fausse: true,
      },
    ],
    ...overrides,
  };
}

export function buildCorrigeRevelation(
  overrides: Partial<CorrigeRevelation> = {},
): CorrigeRevelation {
  return {
    type: 'revelation',
    titre: 'Pourquoi le prix ne revient pas à son point de départ',
    lignes: ['Coefficient global : 1,10 × 0,90 = 0,99, soit −1 %.'],
    ...overrides,
  };
}

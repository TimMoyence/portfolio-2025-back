import type { ConfusionId } from '../../domain/cours/banque/confusions';

export const QUESTIONS_CHIFFREES_B3_01 = [
  'b3-01-a1-lignes-commande',
  'b3-01-a1-lignes-uniques',
  'b3-01-a1-ca-total',
  'b3-01-a1-villes',
  'b3-01-a1-a-verifier',
  'b3-01-a2-ca-rennes-info',
  'b3-01-a2-remises-marseille',
  'b3-01-a2-ca-ouest',
  'b3-01-a2-delai-strasbourg',
  'b3-01-a2-retards',
  'b3-01-a2-taux-marge',
  'b3-01-a2-part-info-rennes',
  'b3-01-a3-agences-sous-objectif',
  'b3-01-a3-atteinte-rennes',
  'b3-01-a3-ca-2026',
  'b3-01-a3-evolution',
  'b3-01-a3-marge-marseille',
  'b3-01-a3-quarantaine',
] as const;

export type QuestionChiffreeB301 = (typeof QUESTIONS_CHIFFREES_B3_01)[number];

export interface ValeursAttenduesB301 extends Readonly<
  Record<QuestionChiffreeB301, number>
> {
  readonly 'b3-01-a2-meilleur-trimestre': string;
}

export type PiegesB301 = Readonly<
  Partial<
    Record<QuestionChiffreeB301, Readonly<Partial<Record<ConfusionId, number>>>>
  >
>;

export type HistoireB301 =
  | 'ca-2025-rennes'
  | 'ca-2025-nantes'
  | 'taux-de-marge-marseille-2025'
  | 'evolution-informatique-rennes'
  | 'evolution-lille'
  | 'delai-median-strasbourg-2025'
  | 'delai-median-reseau-2026';

const EXACT = 0;
const A_L_EURO_PRES = 1;
const AU_DIXIEME_DE_POINT = 0.1;

export const TOLERANCES_B3_01: Readonly<Record<QuestionChiffreeB301, number>> =
  {
    'b3-01-a1-lignes-commande': EXACT,
    'b3-01-a1-lignes-uniques': EXACT,
    'b3-01-a1-ca-total': A_L_EURO_PRES,
    'b3-01-a1-villes': EXACT,
    'b3-01-a1-a-verifier': EXACT,
    'b3-01-a2-ca-rennes-info': A_L_EURO_PRES,
    'b3-01-a2-remises-marseille': EXACT,
    'b3-01-a2-ca-ouest': A_L_EURO_PRES,
    'b3-01-a2-delai-strasbourg': EXACT,
    'b3-01-a2-retards': EXACT,
    'b3-01-a2-taux-marge': AU_DIXIEME_DE_POINT,
    'b3-01-a2-part-info-rennes': AU_DIXIEME_DE_POINT,
    'b3-01-a3-agences-sous-objectif': EXACT,
    'b3-01-a3-atteinte-rennes': AU_DIXIEME_DE_POINT,
    'b3-01-a3-ca-2026': A_L_EURO_PRES,
    'b3-01-a3-evolution': AU_DIXIEME_DE_POINT,
    'b3-01-a3-marge-marseille': AU_DIXIEME_DE_POINT,
    'b3-01-a3-quarantaine': EXACT,
  };

export const VALEURS_B3_01: ValeursAttenduesB301 = {
  'b3-01-a1-lignes-commande': 3,
  'b3-01-a1-lignes-uniques': 4098,
  'b3-01-a1-ca-total': 1_340_208,
  'b3-01-a1-villes': 48,
  'b3-01-a1-a-verifier': 85,
  'b3-01-a2-ca-rennes-info': 8342,
  'b3-01-a2-remises-marseille': 66,
  'b3-01-a2-ca-ouest': 77_850,
  'b3-01-a2-delai-strasbourg': 8,
  'b3-01-a2-retards': 99,
  'b3-01-a2-taux-marge': 32,
  'b3-01-a2-part-info-rennes': 27.2,
  'b3-01-a2-meilleur-trimestre': 'T4 2025',
  'b3-01-a3-agences-sous-objectif': 3,
  'b3-01-a3-atteinte-rennes': 79,
  'b3-01-a3-ca-2026': 575_046,
  'b3-01-a3-evolution': 8.6,
  'b3-01-a3-marge-marseille': 26.9,
  'b3-01-a3-quarantaine': 60,
};

export const PIEGES_B3_01: PiegesB301 = {
  'b3-01-a1-lignes-uniques': { 'doublons-supprimes-sur-une-colonne': 1618 },
  'b3-01-a1-ca-total': { 'texte-pris-pour-nombre': 1_286_319 },
  'b3-01-a1-villes': { 'casse-non-normalisee': 83 },
  'b3-01-a1-a-verifier': { 'suspect-corrige-sans-validation': 39 },
  'b3-01-a2-delai-strasbourg': {
    'jours-calendaires-pour-ouvres': 11,
    'valeur-extreme-ignoree': 9.5,
  },
  'b3-01-a2-retards': { 'jours-calendaires-pour-ouvres': 481 },
  'b3-01-a2-taux-marge': { 'moyenne-simple-des-taux': 35.4 },
  'b3-01-a2-part-info-rennes': { 'pourcentage-du-mauvais-total': 1.5 },
  'b3-01-a3-agences-sous-objectif': { 'objectif-annuel-pour-cumul': 12 },
  'b3-01-a3-atteinte-rennes': { 'objectif-annuel-pour-cumul': 33.8 },
  'b3-01-a3-evolution': { 'evolution-sur-annee-pleine': -22.1 },
  'b3-01-a3-marge-marseille': { 'moyenne-simple-des-taux': 28.7 },
};

export const CLASSEURS_B3_01 = {
  brut: '/assets/cours/b3-01/B3-01_export_ventes.xlsx',
  repriseActe2: '/assets/cours/b3-01/B3-01_reprise_acte_2.e63154db.xlsx',
  repriseActe3: '/assets/cours/b3-01/B3-01_reprise_acte_3.dccca981.xlsx',
} as const;

export const HISTOIRES_B3_01: Readonly<Record<HistoireB301, number>> = {
  'ca-2025-rennes': 52_000,
  'ca-2025-nantes': 59_000,
  'taux-de-marge-marseille-2025': 32.3,
  'evolution-informatique-rennes': -40.2,
  'evolution-lille': 23.1,
  'delai-median-strasbourg-2025': 2,
  'delai-median-reseau-2026': 3,
};

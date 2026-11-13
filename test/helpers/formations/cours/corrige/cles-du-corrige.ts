import { clesDe } from '../lecture-de-cours';

const CLES_DU_CORRIGE: readonly string[] = [
  'solutions',
  'solution',
  'pieges',
  'confusion',
  'confusions',
  'misconception',
  'notes',
  'seuil',
  'remediations',
  'bonne',
  'bonneReponse',
  'corriges',
];

const clesParmi =
  (cles: readonly string[]) =>
  (valeur: unknown): string[] =>
    clesDe(valeur).filter((cle) => cles.includes(cle));

export const clesDuCorrigeDans = clesParmi(CLES_DU_CORRIGE);

const CLES_SECRETES_DE_LA_V3: readonly string[] = [
  ...CLES_DU_CORRIGE,
  'guide',
  'correction',
  'interaction',
  'corrige',
  'banque',
  'attendus',
  'fragment',
  'fausse',
  'valeurAttendue',
  'obligatoires',
];

export const clesSecretesDans = clesParmi(CLES_SECRETES_DE_LA_V3);

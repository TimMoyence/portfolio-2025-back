export const ACCENT = '#4fb3a2';

export interface CouleursDeTeinte {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
}

export const TEINTES = {
  bleu: { bg: '#e0f0fe', text: '#0b5394', border: '#3b82f6' },
  violet: { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' },
  orange: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  rose: { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' },
  vert: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  accent: { bg: '#e7f6f3', text: '#2d8576', border: ACCENT },
} as const satisfies Record<string, CouleursDeTeinte>;

export type Teinte = keyof typeof TEINTES;

export const TEINTE_DES_CATEGORIES: ReadonlyMap<string, Teinte> = new Map([
  ['recherche & veille', 'bleu'],
  ['creation de contenu', 'violet'],
  ['automatisation', 'orange'],
  ['prospection & vente', 'rose'],
  ['productivite', 'vert'],
  ['prospection', 'rose'],
  ['contenu', 'violet'],
  ['site web', 'bleu'],
  ['gestion client', 'vert'],
]);

export const COULEURS_DES_PLATEFORMES = {
  notion: '#0f172a',
  zapier: '#ff4a00',
  make: '#6d28d9',
  accent: ACCENT,
} as const;

export type Plateforme = keyof typeof COULEURS_DES_PLATEFORMES;

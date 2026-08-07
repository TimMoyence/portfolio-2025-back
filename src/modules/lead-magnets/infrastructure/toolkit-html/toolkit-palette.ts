export const ACCENT = '#4fb3a2';

export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  'recherche & veille': { bg: '#e0f0fe', text: '#0b5394', border: '#3b82f6' },
  'creation de contenu': {
    bg: '#f3e8ff',
    text: '#6b21a8',
    border: '#a855f7',
  },
  automatisation: { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  'prospection & vente': {
    bg: '#fce7f3',
    text: '#9d174d',
    border: '#ec4899',
  },
  productivite: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  prospection: { bg: '#fce7f3', text: '#9d174d', border: '#ec4899' },
  contenu: { bg: '#f3e8ff', text: '#6b21a8', border: '#a855f7' },
  'site web': { bg: '#e0f0fe', text: '#0b5394', border: '#3b82f6' },
  'gestion client': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
};

export const PLATFORM_COLORS: Record<string, string> = {
  notion: '#0f172a',
  zapier: '#ff4a00',
  make: '#6d28d9',
};

export const FALLBACK_CATEGORY_PALETTE = {
  bg: '#e7f6f3',
  text: '#2d8576',
  border: ACCENT,
};

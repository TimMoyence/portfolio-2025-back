/** Entree du catalogue de badges Sebastian. */
export interface BadgeCatalogEntry {
  key: string;
  name: string;
  description: string;
  category: 'alcohol' | 'coffee' | 'global';
}

/** Catalogue complet des badges disponibles dans Sebastian. */
export const BADGE_CATALOG: readonly BadgeCatalogEntry[] = [
  {
    key: 'first-log',
    name: 'Premier pas',
    description: 'Premiere entree enregistree',
    category: 'global',
  },
  {
    key: 'zen-monk-7',
    name: 'Moine zen',
    description: '7 jours sans alcool',
    category: 'alcohol',
  },
  {
    key: 'zen-monk-30',
    name: 'Bouddha',
    description: '30 jours sans alcool',
    category: 'alcohol',
  },
  {
    key: 'espresso-machine',
    name: 'Machine a espresso',
    description: '5 cafes en 1 jour',
    category: 'coffee',
  },
  {
    key: 'dry-week',
    name: 'Semaine seche',
    description: '0 alcool sur 7 jours',
    category: 'alcohol',
  },
  {
    key: 'goal-crusher',
    name: 'Objectif ecrase',
    description: '30 jours consecutifs sous objectif',
    category: 'global',
  },
  {
    key: 'early-bird',
    name: 'Leve-tot',
    description: 'Entree avant 7h',
    category: 'global',
  },
  {
    key: 'night-owl',
    name: 'Noctambule',
    description: 'Entree apres minuit',
    category: 'global',
  },
  {
    key: 'perfect-month',
    name: 'Mois parfait',
    description: 'Toutes categories sous objectif pendant 30 jours',
    category: 'global',
  },
  {
    key: 'comeback-kid',
    name: 'Retour en force',
    description: 'Semaine sous objectif apres une au-dessus',
    category: 'global',
  },
] as const;

/** Liste des cles de badges valides. */
export const VALID_BADGE_KEYS = BADGE_CATALOG.map((b) => b.key);

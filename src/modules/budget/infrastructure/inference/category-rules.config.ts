/**
 * Configuration des regles d'inference de categorie pour l'import CSV Revolut.
 *
 * IMPORTANT (RGPD) : la config par defaut ci-dessous ne contient QUE des keywords
 * publics (enseignes, prestataires connus). Toute regle contenant des donnees
 * personnelles (noms de colocataires, identifiants bancaires individuels, contrats
 * d'assurance personnels) doit etre fournie via la variable d'environnement
 * `BUDGET_CATEGORY_RULES_PATH` qui pointe vers un fichier JSON tenu hors du repo.
 *
 * Le format attendu pour le fichier externe est strictement equivalent au type
 * {@link CategoryRulesConfig}.
 */

/**
 * Une regle de matching keyword -> categorie. `amountSign` permet de restreindre
 * l'application de la regle a un signe de montant (revenu/depense), utile pour
 * les regles "Contribution" (revenu) ou "Pockets" (mouvement positif).
 */
export interface CategoryRule {
  readonly keywords: readonly string[];
  readonly categoryName: string;
  readonly amountSign?: 'positive' | 'negative' | 'any';
}

/**
 * Configuration globale d'inference de categorie. Combine une liste ordonnee de
 * regles (premiere match gagne) et un nom de categorie par defaut applique si
 * aucune regle ne matche.
 */
export interface CategoryRulesConfig {
  readonly rules: readonly CategoryRule[];
  readonly defaultCategoryName: string;
  readonly transferPocketCategoryName?: string;
}

/**
 * Config par defaut, anonymisee : enseignes/prestataires publics uniquement.
 * Aucune donnee personnelle ne doit etre ajoutee ici. Utiliser le mecanisme
 * d'override via `BUDGET_CATEGORY_RULES_PATH` pour les regles personnelles.
 */
export const defaultCategoryRulesConfig: CategoryRulesConfig = {
  rules: [
    { keywords: ['edf'], categoryName: 'Electricité & Internet' },
    {
      keywords: [
        'internet',
        'bbox',
        'orange',
        'sfr',
        'bouygues',
        'free telecom',
      ],
      categoryName: 'Electricité & Internet',
    },
    {
      keywords: ['citiz', 'uber', 'kmlocal'],
      categoryName: 'Voiture utilisation',
    },
    {
      keywords: ['amazon', 'netflix', 'ororo'],
      categoryName: 'Netflix & Amazon & Ororo',
    },
    {
      keywords: [
        'carrefour',
        'e.leclerc',
        'picard',
        'lidl',
        'bio coop',
        'casado primeurs',
        'le destin fromager',
        'bigazzi',
        'babel bread',
        'ly kim hak',
        'qu4tre qu4rts',
        'anom cafe club',
        'boucherie',
        'origines',
      ],
      categoryName: 'Courses',
    },
    { keywords: ['pharmacie'], categoryName: 'Achat pour la beauté' },
    {
      keywords: [
        'pub',
        'kitchen',
        'restaurant',
        'darwi',
        'cassonade',
        'arlu',
        'magasin general',
        'les brocs',
        'del arte',
      ],
      categoryName: 'Restaurant',
    },
    { keywords: ['fleurs'], categoryName: 'Gifts' },
    { keywords: ["art'tick"], categoryName: 'Entertainment' },
    {
      keywords: ['salle de sport', 'fitness', 'gym', 'basic fit'],
      categoryName: 'Salle de sport',
    },
    {
      keywords: ['pocket withdrawal'],
      categoryName: 'Pockets',
      amountSign: 'positive',
    },
  ],
  defaultCategoryName: 'Autres',
  transferPocketCategoryName: 'Pockets',
};

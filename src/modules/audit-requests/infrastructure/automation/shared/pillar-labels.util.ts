/**
 * Libelles francais des 7 piliers de l'audit emis par `ScoringService`.
 *
 * Aligne avec le composant frontend `PillarScorecardComponent` pour que
 * emails, PDF et UI partagent exactement les memes intitules. Fallback :
 * la chaine brute du pilier si le mapping est inconnu.
 */
const PILLAR_LABELS: Readonly<Record<string, string>> = {
  seo: 'SEO',
  performance: 'Performance',
  technical: 'Tech & scalabilite',
  trust: 'Credibilite',
  conversion: 'Conversion',
  aiVisibility: 'Visibilite IA',
  citationWorthiness: 'Citabilite IA',
};

/**
 * Retourne le libelle francais lisible d'un pilier a partir de sa cle
 * technique (ex: `aiVisibility` -> `Visibilite IA`). Si la cle est
 * inconnue, retourne la chaine d'origine.
 */
export function pillarLabel(pillar: string): string {
  return PILLAR_LABELS[pillar] ?? pillar;
}

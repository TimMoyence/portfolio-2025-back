/**
 * Aligne avec le composant frontend `PillarScorecardComponent` (depot
 * portfolio-2025-front) pour que emails, PDF et UI partagent exactement
 * les memes intitules.
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

export function pillarLabel(pillar: string): string {
  return PILLAR_LABELS[pillar] ?? pillar;
}

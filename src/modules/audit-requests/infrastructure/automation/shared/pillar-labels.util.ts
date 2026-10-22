import type { PillarKey } from '../../../domain/Piliers';

const PILLAR_LABELS: Readonly<Record<PillarKey, string>> = {
  seo: 'SEO',
  performance: 'Performance',
  technical: 'Tech & scalabilité',
  trust: 'Crédibilité',
  conversion: 'Conversion',
  aiVisibility: 'Visibilité IA',
  citationWorthiness: 'Citabilité IA',
};

export function pillarLabel(pillar: string): string {
  return Object.hasOwn(PILLAR_LABELS, pillar)
    ? PILLAR_LABELS[pillar as PillarKey]
    : pillar;
}

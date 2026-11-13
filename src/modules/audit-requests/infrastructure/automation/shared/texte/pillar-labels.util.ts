import { libelleOuCle } from '../../../../../../common/domain/objets/libelle-ou-cle';
import type { PillarKey } from '../../../../domain/score/Piliers';

const PILLAR_LABELS: Readonly<Record<PillarKey, string>> = {
  seo: 'SEO',
  performance: 'Performance',
  technical: 'Tech & scalabilité',
  trust: 'Crédibilité',
  conversion: 'Conversion',
  aiVisibility: 'Visibilité IA',
  citationWorthiness: 'Citabilité IA',
};

export const pillarLabel = (pillar: string): string =>
  libelleOuCle(PILLAR_LABELS, pillar);

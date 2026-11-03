export const PILLAR_KEYS = Object.freeze([
  'seo',
  'performance',
  'technical',
  'trust',
  'conversion',
  'aiVisibility',
  'citationWorthiness',
] as const);

export type PillarKey = (typeof PILLAR_KEYS)[number];

export type ScoresDesPiliers = Partial<Record<PillarKey, number>>;

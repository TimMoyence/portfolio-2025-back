/**
 * Ce fichier reste cote back pour eviter une dependance cyclique avec
 * le front (la registry formations vit cote Angular). Chaque ajout de
 * formation frontend suppose une mise a jour manuelle de cette liste —
 * documente dans le runbook de livraison d'une nouvelle formation.
 */
export const SUPPORTED_FORMATION_SLUGS = [
  'ia-solopreneurs',
  'automatiser-avec-ia',
] as const;

export type SupportedFormationSlug = (typeof SUPPORTED_FORMATION_SLUGS)[number];

export const isSupportedFormationSlug = (
  value: unknown,
): value is SupportedFormationSlug =>
  typeof value === 'string' &&
  (SUPPORTED_FORMATION_SLUGS as readonly string[]).includes(value);

/**
 * Liste canonique des slugs de formations reconnus par le bounded
 * context Newsletter. Source de verite unique consommee par :
 *  - le DTO d'inscription (`subscribe-newsletter.request.dto.ts`),
 *  - toute validation runtime cote use-case ou scheduler drip.
 *
 * Ce fichier reste cote back pour eviter une dependance cyclique avec
 * le front (la registry formations vit cote Angular). Chaque ajout de
 * formation frontend suppose une mise a jour manuelle de cette liste —
 * documente dans le runbook de livraison d'une nouvelle formation.
 *
 * Evolution prevue (backlog S2.1) : synchronisation automatique via
 * `scripts/sync-formation-slugs.mjs` qui lit la registry front au
 * pre-commit pour garantir la coherence.
 */
export const SUPPORTED_FORMATION_SLUGS = [
  'ia-solopreneurs',
  'automatiser-avec-ia',
] as const;

export type SupportedFormationSlug = (typeof SUPPORTED_FORMATION_SLUGS)[number];

/** Type guard runtime pour valider un slug entrant. */
export const isSupportedFormationSlug = (
  value: unknown,
): value is SupportedFormationSlug =>
  typeof value === 'string' &&
  (SUPPORTED_FORMATION_SLUGS as readonly string[]).includes(value);

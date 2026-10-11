import { enSlug } from '../../../../common/domain/texte/en-slug';

export { escapeHtml, escapeUrl, safeHtml } from 'portfolio-2025-partage/html';
export type { EscapedHtml } from 'portfolio-2025-partage/html';

export function slugify(input: string): string {
  return enSlug(input, 60) || 'audit';
}

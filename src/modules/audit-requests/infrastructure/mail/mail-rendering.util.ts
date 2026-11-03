import { enSlug } from '../../../../common/domain/texte/nettoyage/en-slug';

export {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../../common/domain/texte/nettoyage/html-escape.util';
export type { EscapedHtml } from '../../../../common/domain/texte/nettoyage/html-escape.util';

export function slugify(input: string): string {
  return enSlug(input, 60) || 'audit';
}

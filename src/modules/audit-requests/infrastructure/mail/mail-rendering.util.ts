import { enSlug } from '../../../../common/domain/texte/en-slug';

export {
  escapeHtml,
  escapeUrl,
  safeHtml,
} from '../../../../common/infrastructure/mail/html-escape.util';
export type { EscapedHtml } from '../../../../common/infrastructure/mail/html-escape.util';

export function slugify(input: string): string {
  return enSlug(input, 60) || 'audit';
}

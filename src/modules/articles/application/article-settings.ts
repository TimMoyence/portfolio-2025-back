import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { pageDuSite } from '../../../config/urls-publiques';

export function articlePageUrl(locale: SupportedLocale, slug: string): string {
  return pageDuSite(locale, `articles/${encodeURIComponent(slug)}`);
}

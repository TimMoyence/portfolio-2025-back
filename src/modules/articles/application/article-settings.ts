import type { SupportedLocale } from '../../../common/domain/value-objects/LocaleCode';
import { urlDuSite } from '../../../config/urls-publiques';

export function articlePageUrl(locale: SupportedLocale, slug: string): string {
  return `${urlDuSite()}/${locale}/articles/${encodeURIComponent(slug)}`;
}

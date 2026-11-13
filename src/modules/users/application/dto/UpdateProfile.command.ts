import type { SupportedLocale } from '../../../../common/domain/value-objects/LocaleCode';

export interface UpdateProfileCommand {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  locale?: SupportedLocale;
}

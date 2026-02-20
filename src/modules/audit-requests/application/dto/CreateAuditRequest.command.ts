import type { AuditLocale } from '../../domain/audit-locale.util';

export interface CreateAuditRequestCommand {
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

import { AuditLocale } from './audit-locale.util';

export class AuditRequest {
  id?: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  locale: AuditLocale;
  done?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

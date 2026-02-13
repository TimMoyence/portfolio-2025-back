export class AuditRequest {
  id?: string;
  websiteName: string;
  contactMethod: 'EMAIL' | 'PHONE';
  contactValue: string;
  done?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

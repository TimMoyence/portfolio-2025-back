import { envString, type SourceDEnv } from './env-readers.util';

const ADRESSE_DE_REPONSE_PAR_DEFAUT = 'contact@asilidesign.fr';

export function expediteurDesCourriels(
  source: SourceDEnv = process.env,
): string | undefined {
  return envString('SMTP_FROM', source);
}

export function adresseDeReponse(source: SourceDEnv = process.env): string {
  return envString('SMTP_REPLY_TO', source) ?? ADRESSE_DE_REPONSE_PAR_DEFAUT;
}

export function destinataireDesNotifications(
  source: SourceDEnv = process.env,
): string | undefined {
  return envString('CONTACT_NOTIFICATION_TO', source);
}

export function destinataireDesRapportsDAudit(
  source: SourceDEnv = process.env,
): string | undefined {
  return (
    envString('AUDIT_REPORT_TO', source) ?? destinataireDesNotifications(source)
  );
}

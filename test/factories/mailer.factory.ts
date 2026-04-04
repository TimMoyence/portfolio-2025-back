import type { Transporter } from 'nodemailer';
import type { IPasswordResetNotifier } from '../../src/modules/users/domain/IPasswordResetNotifier';
import type { IBudgetShareNotifier } from '../../src/modules/budget/domain/IBudgetShareNotifier';

/** Cree un mock du notifier de reset password. */
export function createMockPasswordResetNotifier(): jest.Mocked<IPasswordResetNotifier> {
  return {
    sendPasswordResetEmail: jest.fn(),
  };
}

/** Cree un mock du notifier de partage de budget. */
export function createMockBudgetShareNotifier(): jest.Mocked<IBudgetShareNotifier> {
  return {
    sendBudgetShareNotification: jest.fn(),
  };
}

/** Cree un mock du transporter nodemailer. */
export function createMockTransporter(): jest.Mocked<
  Pick<Transporter, 'sendMail'>
> {
  return {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  };
}

/** Valeurs SMTP par defaut pour les tests. */
export const DEFAULT_SMTP_ENV = {
  SMTP_HOST: 'smtp.test.local',
  SMTP_PORT: '587',
  SMTP_USER: 'user@test.local',
  SMTP_PASS: 'secret',
  SMTP_FROM: 'no-reply@test.local',
  SMTP_SECURE: 'false',
} as const;

/** Valeurs supplementaires pour AuditRequestMailer. */
export const DEFAULT_AUDIT_ENV = {
  ...DEFAULT_SMTP_ENV,
  CONTACT_NOTIFICATION_TO: 'admin@test.local',
  AUDIT_REPORT_TO: 'reports@test.local',
} as const;

/**
 * Configure les variables d'environnement SMTP et retourne une fonction de nettoyage.
 * Usage: `const cleanup = setSmtpEnv()` en beforeEach, `cleanup()` en afterEach.
 */
export function setSmtpEnv(overrides: Record<string, string> = {}): () => void {
  const vars = { ...DEFAULT_SMTP_ENV, ...overrides };
  const original: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(vars)) {
    original[key] = process.env[key];
    process.env[key] = value;
  }

  return () => {
    for (const [key] of Object.entries(vars)) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  };
}

import type { Transporter } from 'nodemailer';
import type { IPasswordResetNotifier } from '../../src/modules/users/domain/IPasswordResetNotifier';

export function createMockPasswordResetNotifier(): jest.Mocked<IPasswordResetNotifier> {
  return {
    sendPasswordResetEmail: jest.fn(),
  };
}

export function createMockTransporter(): jest.Mocked<
  Pick<Transporter, 'sendMail'>
> {
  return {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  };
}

export const DEFAULT_SMTP_ENV = {
  SMTP_HOST: 'smtp.test.local',
  SMTP_PORT: '587',
  SMTP_USER: 'user@test.local',
  SMTP_PASS: 'secret',
  SMTP_FROM: 'no-reply@test.local',
  SMTP_SECURE: 'false',
} as const;

export const DEFAULT_AUDIT_ENV = {
  ...DEFAULT_SMTP_ENV,
  CONTACT_NOTIFICATION_TO: 'admin@test.local',
  AUDIT_REPORT_TO: 'reports@test.local',
} as const;

export function setSmtpEnv(overrides: Record<string, string> = {}): () => void {
  const vars = { ...DEFAULT_SMTP_ENV, ...overrides };
  const original: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(vars)) {
    original[key] = process.env[key];
    process.env[key] = value;
  }

  // Les variables DKIM ne sont jamais posees par defaut, mais elles
  // ajoutent une cle `dkim` a l'objet passe a `createTransport` quand
  // elles trainent dans l'environnement. Les specs mailer qui comparent
  // cet objet en egalite stricte casseraient alors sans rapport avec
  // leur sujet : on les neutralise ici, et on les restaure ensuite.
  for (const key of DKIM_ENV_KEYS) {
    if (key in overrides) continue;
    original[key] = process.env[key];
    delete process.env[key];
  }

  return () => {
    for (const key of [...Object.keys(vars), ...DKIM_ENV_KEYS]) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  };
}

const DKIM_ENV_KEYS = [
  'SMTP_DKIM_DOMAIN',
  'SMTP_DKIM_SELECTOR',
  'SMTP_DKIM_PRIVATE_KEY',
] as const;

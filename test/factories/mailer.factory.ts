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

export interface MailEnvoye {
  readonly from?: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  readonly replyTo?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly attachments?: ReadonlyArray<{
    readonly filename: string;
    readonly content: Buffer;
    readonly contentType: string;
  }>;
}

export function premierMailEnvoye(
  transporter: Pick<Transporter, 'sendMail'>,
): MailEnvoye {
  return (transporter.sendMail as jest.Mock).mock.calls[0][0] as MailEnvoye;
}

export const envoiSmtpSimule = jest
  .fn()
  .mockResolvedValue({ messageId: 'test-id' });

export const moduleSmtpSimule = () => ({
  createOptionalSmtpTransporter: jest.fn(() => ({ sendMail: envoiSmtpSimule })),
});

export function mailSimule(): MailEnvoye {
  expect(envoiSmtpSimule).toHaveBeenCalledTimes(1);
  return premierMailEnvoye({ sendMail: envoiSmtpSimule });
}

export function attendreScriptEchappe(html: string): void {
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
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

export function retirerSmtpEnv(): () => void {
  const restaurer = setSmtpEnv();
  for (const cle of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']) {
    delete process.env[cle];
  }
  return restaurer;
}

const DKIM_ENV_KEYS = [
  'SMTP_DKIM_DOMAIN',
  'SMTP_DKIM_SELECTOR',
  'SMTP_DKIM_PRIVATE_KEY',
] as const;

import type { createTransport, Transporter } from 'nodemailer';
import type { IPasswordResetNotifier } from '../../src/modules/users/domain/IPasswordResetNotifier';
import { poserVariables } from '../helpers/environnement';

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

export function codesBrutsDuCourriel(
  courriel: Pick<MailEnvoye, 'html' | 'text'>,
  codes: readonly string[],
): string[] {
  return codes.filter(
    (code) => courriel.html.includes(code) || courriel.text.includes(code),
  );
}

export const nodemailerSimule = () => ({ createTransport: jest.fn() });

export function creationDeTransportSimulee(): jest.MockedFunction<
  typeof createTransport
> {
  return jest.requireMock<{
    createTransport: jest.MockedFunction<typeof createTransport>;
  }>('nodemailer').createTransport;
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

const DKIM_ENV_KEYS = [
  'SMTP_DKIM_DOMAIN',
  'SMTP_DKIM_SELECTOR',
  'SMTP_DKIM_PRIVATE_KEY',
] as const;

export const SMTP_ET_DKIM_ABSENTS: Readonly<Record<string, undefined>> =
  Object.fromEntries(
    [...Object.keys(DEFAULT_SMTP_ENV), ...DKIM_ENV_KEYS].map((cle) => [
      cle,
      undefined,
    ]),
  );

export function setSmtpEnv(
  overrides: Readonly<Record<string, string | undefined>> = {},
): () => void {
  return poserVariables({
    ...SMTP_ET_DKIM_ABSENTS,
    ...DEFAULT_SMTP_ENV,
    ...overrides,
  });
}

export function retirerSmtpEnv(): () => void {
  return setSmtpEnv({
    SMTP_HOST: undefined,
    SMTP_PORT: undefined,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
  });
}

interface CreationDeTransportSimulee {
  mockReset(): unknown;
  mockReturnValue(transporteur: never): unknown;
}

export function smtpSimule(creerTransport?: CreationDeTransportSimulee) {
  const etat = {
    transporteur: createMockTransporter(),
    restaurer: (): void => undefined,
  };

  afterEach(() => {
    etat.restaurer();
    etat.restaurer = () => undefined;
    creerTransport?.mockReset();
  });

  return {
    brancher(env: Record<string, string> = {}) {
      etat.transporteur = createMockTransporter();
      creerTransport?.mockReturnValue(etat.transporteur as never);
      etat.restaurer = setSmtpEnv(env);
      return etat.transporteur;
    },
    retirer() {
      etat.restaurer = retirerSmtpEnv();
    },
    transporteur: () => etat.transporteur,
    premierMail: () => premierMailEnvoye(etat.transporteur),
  };
}

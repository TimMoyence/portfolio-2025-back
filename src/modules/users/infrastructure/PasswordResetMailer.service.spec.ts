import { Logger } from '@nestjs/common';
import type { PasswordResetNotificationPayload } from '../domain/IPasswordResetNotifier';
import {
  attendreScriptEchappe,
  createMockTransporter,
  creationDeTransportSimulee,
  DEFAULT_SMTP_ENV,
  nodemailerSimule,
  premierMailEnvoye,
  retirerSmtpEnv,
  setSmtpEnv,
} from '../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => nodemailerSimule());

import { PasswordResetMailerService } from './PasswordResetMailer.service';

const mockedCreateTransport = creationDeTransportSimulee();

class TestablePasswordResetMailer extends PasswordResetMailerService {
  public testEscapeHtml(input: string): string {
    return (
      this as unknown as { escapeHtml: (s: string) => string }
    ).escapeHtml(input);
  }
}

function buildPayload(
  overrides: Partial<PasswordResetNotificationPayload> = {},
): PasswordResetNotificationPayload {
  return {
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    resetUrl: 'https://app.local/reset?token=abc123',
    expiresInMinutes: 30,
    ...overrides,
  };
}

describe('PasswordResetMailerService', () => {
  let cleanupEnv: () => void;
  let transporter: ReturnType<typeof createMockTransporter>;

  const monter = (
    env: Record<string, string> = {},
  ): TestablePasswordResetMailer => {
    transporter = createMockTransporter();
    mockedCreateTransport.mockReturnValue(transporter as never);
    cleanupEnv = setSmtpEnv(env);
    return new TestablePasswordResetMailer();
  };

  const envoyer = async (
    payload = buildPayload(),
    env: Record<string, string> = {},
  ) => {
    await monter(env).sendPasswordResetEmail(payload);
    return premierMailEnvoye(transporter);
  };

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
    mockedCreateTransport.mockReset();
  });

  describe('constructor', () => {
    it('devrait creer un transporter quand la config SMTP est complete', async () => {
      await envoyer();

      expect(mockedCreateTransport).toHaveBeenCalledWith({
        host: DEFAULT_SMTP_ENV.SMTP_HOST,
        port: Number(DEFAULT_SMTP_ENV.SMTP_PORT),
        secure: false,
        auth: {
          user: DEFAULT_SMTP_ENV.SMTP_USER,
          pass: DEFAULT_SMTP_ENV.SMTP_PASS,
        },
      });
    });

    it.each([
      ['le port est 465', { SMTP_PORT: '465' }, 465],
      [
        'SMTP_SECURE=true meme hors du port 465',
        { SMTP_SECURE: 'true' },
        Number(DEFAULT_SMTP_ENV.SMTP_PORT),
      ],
    ])(
      'devrait activer secure quand %s, et envoyer par ce transporter',
      async (_label, env, port) => {
        await envoyer(buildPayload(), env);

        expect(mockedCreateTransport).toHaveBeenCalledWith(
          expect.objectContaining({ port, secure: true }),
        );
        expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      },
    );

    it('devrait logger un warn et ne rien envoyer sans config SMTP', async () => {
      cleanupEnv = retirerSmtpEnv();
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      await new TestablePasswordResetMailer().sendPasswordResetEmail(
        buildPayload(),
      );

      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Password reset mailer disabled'),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('devrait envoyer un email avec le bon payload', async () => {
      const payload = buildPayload();

      const mail = await envoyer(payload);

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mail.from).toBe(DEFAULT_SMTP_ENV.SMTP_FROM);
      expect(mail.to).toBe(payload.email);
      expect(mail.subject).toBe('Reinitialisation de votre mot de passe');
      expect(mail.text).toContain('Jean Dupont');
      expect(mail.text).toContain('30 minutes');
      expect(mail.text).toContain(payload.resetUrl);
      expect(mail.html).toContain('Jean Dupont');
      expect(mail.html).toContain(payload.resetUrl);
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      const service = monter();
      transporter.sendMail.mockRejectedValue(new Error('SMTP timeout'));

      await expect(
        service.sendPasswordResetEmail(buildPayload()),
      ).rejects.toThrow('SMTP timeout');
    });

    it('devrait echapper les caracteres HTML dans le nom et l URL', async () => {
      const { html } = await envoyer(
        buildPayload({
          firstName: '<script>',
          lastName: 'alert("xss")',
          resetUrl: 'https://evil.com/?q=<img onerror="hack">',
        }),
      );

      attendreScriptEchappe(html);
      expect(html).toContain('&quot;xss&quot;');
      expect(html).not.toContain('<img onerror');
    });

    it('devrait gerer un fullName avec espaces autour (trim)', async () => {
      const { text } = await envoyer(
        buildPayload({ firstName: '', lastName: 'Solo' }),
      );

      expect(text).toContain('Bonjour Solo,');
    });
  });

  describe('escapeHtml', () => {
    it.each([
      [
        '<script>alert("xss")</script>',
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      ],
      ["Tom & Jerry's <adventure>", 'Tom &amp; Jerry&#39;s &lt;adventure&gt;'],
    ])('devrait echapper %s', (entree, attendu) => {
      expect(monter().testEscapeHtml(entree)).toBe(attendu);
    });
  });
});

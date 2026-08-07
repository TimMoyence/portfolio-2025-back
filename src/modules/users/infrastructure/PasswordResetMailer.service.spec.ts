import { createTransport } from 'nodemailer';
import type { PasswordResetNotificationPayload } from '../domain/IPasswordResetNotifier';
import { PasswordResetMailerService } from './PasswordResetMailer.service';
import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_SMTP_ENV,
} from '../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockedCreateTransport = createTransport as jest.MockedFunction<
  typeof createTransport
>;

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
  let mockTransporter: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
    mockedCreateTransport.mockReset();
  });

  describe('constructor', () => {
    it('devrait creer un transporter quand la config SMTP est complete', () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();

      const service = new TestablePasswordResetMailer();

      expect(mockedCreateTransport).toHaveBeenCalledWith({
        host: DEFAULT_SMTP_ENV.SMTP_HOST,
        port: Number(DEFAULT_SMTP_ENV.SMTP_PORT),
        secure: false,
        auth: {
          user: DEFAULT_SMTP_ENV.SMTP_USER,
          pass: DEFAULT_SMTP_ENV.SMTP_PASS,
        },
      });
      expect(service).toBeDefined();
    });

    it('devrait activer secure quand le port est 465', () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv({ SMTP_PORT: '465' });

      new TestablePasswordResetMailer();

      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait activer secure quand SMTP_SECURE vaut true', () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv({ SMTP_SECURE: 'true' });

      new TestablePasswordResetMailer();

      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait logger un warn et ne pas creer de transporter sans config SMTP', () => {
      cleanupEnv = setSmtpEnv({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
      });
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const warnSpy = jest
        .spyOn(
          (
            PasswordResetMailerService as unknown as {
              prototype: { logger: { warn: (...args: unknown[]) => void } };
            }
          ).prototype.logger ?? console,
          'warn',
        )
        .mockImplementation();

      const service = new TestablePasswordResetMailer();

      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(service).toBeDefined();
      warnSpy.mockRestore();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('devrait envoyer un email avec le bon payload', async () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload();

      await service.sendPasswordResetEmail(payload);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.from).toBe(DEFAULT_SMTP_ENV.SMTP_FROM);
      expect(call.to).toBe(payload.email);
      expect(call.subject).toBe('Reinitialisation de votre mot de passe');
      expect(call.text).toContain('Jean Dupont');
      expect(call.text).toContain('30 minutes');
      expect(call.text).toContain(payload.resetUrl);
      expect(call.html).toContain('Jean Dupont');
      expect(call.html).toContain(payload.resetUrl);
    });

    it('devrait ne rien faire si le transporter est absent (SMTP non configure)', async () => {
      cleanupEnv = setSmtpEnv({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
      });
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload();

      await service.sendPasswordResetEmail(payload);

      expect(mockedCreateTransport).not.toHaveBeenCalled();
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      mockTransporter = createMockTransporter();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP timeout'),
      );
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload();

      await expect(service.sendPasswordResetEmail(payload)).rejects.toThrow(
        'SMTP timeout',
      );
    });

    it('devrait echapper les caracteres HTML dans le nom et l URL', async () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload({
        firstName: '<script>',
        lastName: 'alert("xss")',
        resetUrl: 'https://evil.com/?q=<img onerror="hack">',
      });

      await service.sendPasswordResetEmail(payload);

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
      expect(call.html).toContain('&quot;xss&quot;');
      expect(call.html).not.toContain('<img onerror');
    });

    it('devrait gerer un fullName avec espaces autour (trim)', async () => {
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload({ firstName: '', lastName: 'Solo' });

      await service.sendPasswordResetEmail(payload);

      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.text).toContain('Bonjour Solo,');
    });
  });

  describe('escapeHtml', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      cleanupEnv = setSmtpEnv();
      mockedCreateTransport.mockReturnValue(createMockTransporter() as never);
      const service = new TestablePasswordResetMailer();

      const result = service.testEscapeHtml('<script>alert("xss")</script>');

      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      cleanupEnv = setSmtpEnv();
      mockedCreateTransport.mockReturnValue(createMockTransporter() as never);
      const service = new TestablePasswordResetMailer();

      const result = service.testEscapeHtml("Tom & Jerry's <adventure>");

      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });
  });
});

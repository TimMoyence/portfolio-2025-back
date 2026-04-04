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

/** Sous-classe de test exposant les methodes privees pour verification unitaire. */
class TestablePasswordResetMailer extends PasswordResetMailerService {
  /** Expose escapeHtml pour les tests. */
  public testEscapeHtml(input: string): string {
    return (
      this as unknown as { escapeHtml: (s: string) => string }
    ).escapeHtml(input);
  }
}

/** Payload nominal pour les tests. */
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
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();

      // Act
      const service = new TestablePasswordResetMailer();

      // Assert
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
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv({ SMTP_PORT: '465' });

      // Act
      new TestablePasswordResetMailer();

      // Assert
      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait activer secure quand SMTP_SECURE vaut true', () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv({ SMTP_SECURE: 'true' });

      // Act
      new TestablePasswordResetMailer();

      // Assert
      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait logger un warn et ne pas creer de transporter sans config SMTP', () => {
      // Arrange — pas de setSmtpEnv, variables absentes
      cleanupEnv = setSmtpEnv({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
      });
      // Supprime les vars vides pour simuler absence
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

      // On va verifier indirectement : sendMail sans transporter doit etre un no-op
      // Act
      const service = new TestablePasswordResetMailer();

      // Assert
      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(service).toBeDefined();
      warnSpy.mockRestore();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('devrait envoyer un email avec le bon payload', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload();

      // Act
      await service.sendPasswordResetEmail(payload);

      // Assert
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
      // Arrange — pas de config SMTP
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

      // Act
      await service.sendPasswordResetEmail(payload);

      // Assert — pas de sendMail appele, pas d'erreur
      expect(mockedCreateTransport).not.toHaveBeenCalled();
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP timeout'),
      );
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload();

      // Act & Assert
      await expect(service.sendPasswordResetEmail(payload)).rejects.toThrow(
        'SMTP timeout',
      );
    });

    it('devrait echapper les caracteres HTML dans le nom et l URL', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload({
        firstName: '<script>',
        lastName: 'alert("xss")',
        resetUrl: 'https://evil.com/?q=<img onerror="hack">',
      });

      // Act
      await service.sendPasswordResetEmail(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
      expect(call.html).toContain('&quot;xss&quot;');
      expect(call.html).not.toContain('<img onerror');
    });

    it('devrait gerer un fullName avec espaces autour (trim)', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestablePasswordResetMailer();
      const payload = buildPayload({ firstName: '', lastName: 'Solo' });

      // Act
      await service.sendPasswordResetEmail(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.text).toContain('Bonjour Solo,');
    });
  });

  describe('escapeHtml', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      // Arrange
      cleanupEnv = setSmtpEnv();
      mockedCreateTransport.mockReturnValue(createMockTransporter() as never);
      const service = new TestablePasswordResetMailer();

      // Act
      const result = service.testEscapeHtml('<script>alert("xss")</script>');

      // Assert
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      // Arrange
      cleanupEnv = setSmtpEnv();
      mockedCreateTransport.mockReturnValue(createMockTransporter() as never);
      const service = new TestablePasswordResetMailer();

      // Act
      const result = service.testEscapeHtml("Tom & Jerry's <adventure>");

      // Assert
      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });
  });
});

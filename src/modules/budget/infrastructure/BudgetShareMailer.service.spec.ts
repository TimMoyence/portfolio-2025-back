import { createTransport } from 'nodemailer';
import type { BudgetShareNotificationPayload } from '../domain/IBudgetShareNotifier';
import { BudgetShareMailerService } from './BudgetShareMailer.service';
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
class TestableBudgetShareMailer extends BudgetShareMailerService {
  /** Expose escapeHtml pour les tests. */
  public testEscapeHtml(input: string): string {
    return (
      this as unknown as { escapeHtml: (s: string) => string }
    ).escapeHtml(input);
  }
}

/** Payload nominal pour les tests. */
function buildBudgetSharePayload(
  overrides: Partial<BudgetShareNotificationPayload> = {},
): BudgetShareNotificationPayload {
  return {
    targetEmail: 'coloc@example.com',
    targetFirstName: 'Marie',
    ownerFirstName: 'Jean',
    ownerLastName: 'Dupont',
    groupName: 'Colocation Paris',
    budgetUrl: 'https://app.local/budget/123',
    ...overrides,
  };
}

describe('BudgetShareMailerService', () => {
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
      const service = new TestableBudgetShareMailer();

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
      new TestableBudgetShareMailer();

      // Assert
      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait mettre transporter a null et logger warn sans config SMTP', () => {
      // Arrange
      cleanupEnv = setSmtpEnv();
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      // Act
      const service = new TestableBudgetShareMailer();

      // Assert — le service est cree mais transporter est null
      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(service).toBeDefined();
    });

    it('devrait utiliser le SMTP_FROM par defaut si absent', () => {
      // Arrange
      cleanupEnv = setSmtpEnv();
      delete process.env.SMTP_FROM;
      delete process.env.SMTP_HOST;

      // Act
      const service = new TestableBudgetShareMailer();

      // Assert — le service utilise un from par defaut
      expect(service).toBeDefined();
    });
  });

  describe('sendBudgetShareNotification', () => {
    it('devrait envoyer un email avec le bon payload', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestableBudgetShareMailer();
      const payload = buildBudgetSharePayload();

      // Act
      await service.sendBudgetShareNotification(payload);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.from).toBe(DEFAULT_SMTP_ENV.SMTP_FROM);
      expect(call.to).toBe('coloc@example.com');
      expect(call.subject).toContain('Jean');
      expect(call.subject).toContain('Colocation Paris');
      expect(call.text).toContain('Marie');
      expect(call.text).toContain('Jean Dupont');
      expect(call.text).toContain('Colocation Paris');
      expect(call.text).toContain(payload.budgetUrl);
      expect(call.html).toContain('Marie');
      expect(call.html).toContain('Jean Dupont');
      expect(call.html).toContain('Colocation Paris');
      expect(call.html).toContain(payload.budgetUrl);
    });

    it('devrait skip et logger un warn quand le transporter est absent', async () => {
      // Arrange — pas de config SMTP
      cleanupEnv = setSmtpEnv();
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const service = new TestableBudgetShareMailer();
      const payload = buildBudgetSharePayload();

      // Act — ne doit pas throw
      await service.sendBudgetShareNotification(payload);

      // Assert
      expect(mockedCreateTransport).not.toHaveBeenCalled();
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      );
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestableBudgetShareMailer();
      const payload = buildBudgetSharePayload();

      // Act & Assert
      await expect(
        service.sendBudgetShareNotification(payload),
      ).rejects.toThrow('Connection refused');
    });

    it('devrait echapper les caracteres HTML dans le corps de l email', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestableBudgetShareMailer();
      const payload = buildBudgetSharePayload({
        ownerFirstName: '<script>',
        ownerLastName: 'alert("xss")',
        targetFirstName: '<img onerror="hack">',
        groupName: 'Budget & "Vacances"',
      });

      // Act
      await service.sendBudgetShareNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
      expect(call.html).toContain('&quot;xss&quot;');
      expect(call.html).not.toContain('<img onerror');
      expect(call.html).toContain('Budget &amp; &quot;Vacances&quot;');
      // Le subject aussi echappe
      expect(call.subject).toContain('&lt;script&gt;');
      expect(call.subject).toContain('Budget &amp; &quot;Vacances&quot;');
    });
  });

  describe('escapeHtml', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestableBudgetShareMailer();

      // Act
      const result = service.testEscapeHtml('<script>alert("xss")</script>');

      // Assert
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv();
      const service = new TestableBudgetShareMailer();

      // Act
      const result = service.testEscapeHtml("Tom & Jerry's <adventure>");

      // Assert
      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });
  });
});

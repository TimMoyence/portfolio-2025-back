import { createTransport } from 'nodemailer';
import { AuditRequestMailerService } from './AuditRequestMailer.service';
import {
  buildAuditRequest,
  buildAuditReportPayload,
} from '../../../../test/factories/audit-requests.factory';
import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../test/factories/mailer.factory';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const mockedCreateTransport = createTransport as jest.MockedFunction<
  typeof createTransport
>;

/** Sous-classe de test exposant escapeHtml pour verification unitaire. */
class TestableAuditRequestMailer extends AuditRequestMailerService {
  /** Expose escapeHtml pour les tests. */
  public testEscapeHtml(input: string): string {
    return (
      this as unknown as { escapeHtml: (s: string) => string }
    ).escapeHtml(input);
  }
}

describe('AuditRequestMailerService', () => {
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
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);

      // Act
      const service = new TestableAuditRequestMailer();

      // Assert
      expect(mockedCreateTransport).toHaveBeenCalledWith({
        host: DEFAULT_AUDIT_ENV.SMTP_HOST,
        port: Number(DEFAULT_AUDIT_ENV.SMTP_PORT),
        secure: false,
        auth: {
          user: DEFAULT_AUDIT_ENV.SMTP_USER,
          pass: DEFAULT_AUDIT_ENV.SMTP_PASS,
        },
      });
      expect(service).toBeDefined();
    });

    it('devrait activer secure quand le port est 465', () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv({ ...DEFAULT_AUDIT_ENV, SMTP_PORT: '465' });

      // Act
      new TestableAuditRequestMailer();

      // Assert
      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });

    it('devrait logger warn et ne pas creer de transporter sans config SMTP', () => {
      // Arrange
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      // Act
      const service = new TestableAuditRequestMailer();

      // Assert
      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(service).toBeDefined();
    });
  });

  describe('sendAuditNotification', () => {
    it('devrait envoyer un email de notification avec le bon payload', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const request = buildAuditRequest({
        id: 'audit-001',
        websiteName: 'mon-site.fr',
        contactValue: 'client@example.com',
      });

      // Act
      await service.sendAuditNotification(request);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.from).toBe(DEFAULT_AUDIT_ENV.SMTP_FROM);
      expect(call.to).toBe(DEFAULT_AUDIT_ENV.CONTACT_NOTIFICATION_TO);
      expect(call.subject).toContain('audit SEO');
      expect(call.text).toContain('mon-site.fr');
      expect(call.text).toContain('EMAIL');
      expect(call.text).toContain('client@example.com');
      expect(call.html).toContain('mon-site.fr');
    });

    it('devrait ne rien faire sans transporter', async () => {
      // Arrange
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const service = new TestableAuditRequestMailer();
      const request = buildAuditRequest();

      // Act
      await service.sendAuditNotification(request);

      // Assert
      expect(mockedCreateTransport).not.toHaveBeenCalled();
    });

    it('devrait ne rien faire si CONTACT_NOTIFICATION_TO est absent', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.CONTACT_NOTIFICATION_TO;
      const service = new TestableAuditRequestMailer();
      const request = buildAuditRequest();

      // Act
      await service.sendAuditNotification(request);

      // Assert
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('devrait echapper le HTML dans le corps de l email', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const request = buildAuditRequest({
        websiteName: '<script>alert("xss")</script>',
        contactValue: 'test@"evil".com',
      });

      // Act
      await service.sendAuditNotification(request);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP error'),
      );
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const request = buildAuditRequest();

      // Act & Assert
      await expect(service.sendAuditNotification(request)).rejects.toThrow(
        'SMTP error',
      );
    });
  });

  describe('sendAuditReportNotification', () => {
    it('devrait envoyer un rapport complet avec le bon payload', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.from).toBe(DEFAULT_AUDIT_ENV.SMTP_FROM);
      expect(call.to).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
      expect(call.subject).toContain('mon-site.fr');
      expect(call.subject).toContain('Rapport');
      // Contenu text
      expect(call.text).toContain('audit-001');
      expect(call.text).toContain('mon-site.fr');
      expect(call.text).toContain('Resume du rapport de test.');
      expect(call.text).toContain('Explication du rapport.');
      expect(call.text).toContain('Resume executif.');
      expect(call.text).toContain('Corriger les meta descriptions');
      expect(call.text).toContain('Next.js');
      expect(call.text).toContain('VALIDE');
      // Contenu html
      expect(call.html).toContain('audit-001');
      expect(call.html).toContain('mon-site.fr');
      expect(call.html).toContain('Next.js');
    });

    it('devrait ne rien faire sans transporter', async () => {
      // Arrange
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      expect(mockedCreateTransport).not.toHaveBeenCalled();
    });

    it('devrait ne rien faire si AUDIT_REPORT_TO est absent', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.AUDIT_REPORT_TO;
      delete process.env.CONTACT_NOTIFICATION_TO;
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('devrait utiliser CONTACT_NOTIFICATION_TO comme fallback pour reportTo', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.AUDIT_REPORT_TO;
      // CONTACT_NOTIFICATION_TO est toujours defini
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.to).toBe(DEFAULT_AUDIT_ENV.CONTACT_NOTIFICATION_TO);
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP timeout'),
      );
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act & Assert
      await expect(
        service.sendAuditReportNotification(payload),
      ).rejects.toThrow('SMTP timeout');
    });

    it('devrait gerer un fullReport minimal (donnees manquantes) avec fallbacks', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload({
        fullReport: {},
        locale: 'fr',
      });

      // Act — ne doit pas throw
      await service.sendAuditReportNotification(payload);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      // Doit contenir les fallbacks fr
      expect(call.text).toContain('Resume executif non disponible.');
      expect(call.text).toContain('INDISPONIBLE');
      expect(call.text).toContain('Non verifiable');
    });

    it('devrait gerer la locale en pour le rapport', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload({
        locale: 'en',
        fullReport: { locale: 'en' },
      });

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.subject).toContain('Technical Audit Report Completed');
      expect(call.text).toContain('Executive summary unavailable.');
      expect(call.text).toContain('NOT_AVAILABLE');
      expect(call.text).toContain('Not verifiable');
    });

    it('devrait inclure les donnees de cout et quality gate dans le texte', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.text).toContain('3200');
      expect(call.text).toContain('4800');
      expect(call.text).toContain('EUR');
      expect(call.text).toContain('40h');
      expect(call.text).toContain('All checks passed');
    });

    it('devrait inclure les plans d implementation dans le texte', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload();

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      // Todo
      expect(call.text).toContain('Phase 1');
      expect(call.text).toContain('SEO basique');
      // Semaine
      expect(call.text).toContain('Meta descriptions');
      // Mois
      expect(call.text).toContain('Refonte navigation');
      // Fast plan
      expect(call.text).toContain('Fix title tags');
      // Backlog
      expect(call.text).toContain('Schema markup');
      // Invoice
      expect(call.text).toContain('Lot SEO');
    });

    it('devrait echapper le HTML dans le rapport', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();
      const payload = buildAuditReportPayload({
        websiteName: '<script>xss</script>',
      });

      // Act
      await service.sendAuditReportNotification(payload);

      // Assert
      const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(call.html).not.toContain('<script>xss</script>');
      expect(call.html).toContain('&lt;script&gt;xss&lt;/script&gt;');
    });
  });

  describe('escapeHtml', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      // Arrange
      mockTransporter = createMockTransporter();
      mockedCreateTransport.mockReturnValue(mockTransporter as never);
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();

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
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const service = new TestableAuditRequestMailer();

      // Act
      const result = service.testEscapeHtml("Tom & Jerry's <adventure>");

      // Assert
      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });
  });
});

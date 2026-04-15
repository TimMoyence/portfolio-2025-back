import { buildAuditRequest } from '../../../../../../test/factories/audit-requests.factory';
import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { AuditNotificationMailer } from '../audit-notification.mailer';
import { escapeHtml } from '../mail-rendering.util';
import type { SmtpTransporter } from '../smtp-transporter.provider';

describe('AuditNotificationMailer', () => {
  let cleanupEnv: () => void;
  let mockTransporter: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
  });

  describe('sendAuditNotification', () => {
    it('devrait envoyer un email de notification avec le bon payload', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const mailer = new AuditNotificationMailer(
        mockTransporter as unknown as SmtpTransporter,
      );
      const request = buildAuditRequest({
        id: 'audit-001',
        websiteName: 'mon-site.fr',
        contactValue: 'client@example.com',
      });

      // Act
      await mailer.sendAuditNotification(request);

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
      const mailer = new AuditNotificationMailer(null);
      const request = buildAuditRequest();

      // Act & Assert
      await expect(
        mailer.sendAuditNotification(request),
      ).resolves.toBeUndefined();
    });

    it('devrait ne rien faire si CONTACT_NOTIFICATION_TO est absent', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      delete process.env.CONTACT_NOTIFICATION_TO;
      const mailer = new AuditNotificationMailer(
        mockTransporter as unknown as SmtpTransporter,
      );
      const request = buildAuditRequest();

      // Act
      await mailer.sendAuditNotification(request);

      // Assert
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('devrait echapper le HTML dans le corps de l email', async () => {
      // Arrange
      mockTransporter = createMockTransporter();
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const mailer = new AuditNotificationMailer(
        mockTransporter as unknown as SmtpTransporter,
      );
      const request = buildAuditRequest({
        websiteName: '<script>alert("xss")</script>',
        contactValue: 'test@"evil".com',
      });

      // Act
      await mailer.sendAuditNotification(request);

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
      cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
      const mailer = new AuditNotificationMailer(
        mockTransporter as unknown as SmtpTransporter,
      );
      const request = buildAuditRequest();

      // Act & Assert
      await expect(mailer.sendAuditNotification(request)).rejects.toThrow(
        'SMTP error',
      );
    });
  });

  describe('escapeHtml (util pure)', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      // Act
      const result = escapeHtml('<script>alert("xss")</script>');

      // Assert
      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      // Act
      const result = escapeHtml("Tom & Jerry's <adventure>");

      // Assert
      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });
  });
});

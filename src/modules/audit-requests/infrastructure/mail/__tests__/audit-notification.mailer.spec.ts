import { buildAuditRequest } from '../../../../../../test/factories/audit-requests.factory';
import {
  attendreScriptEchappe,
  createMockTransporter,
  premierMailEnvoye,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { AuditNotificationMailer } from '../audit-notification.mailer';
import { escapeHtml } from '../mail-rendering.util';
import type { SmtpTransporter } from '../smtp-transporter.provider';

describe('AuditNotificationMailer', () => {
  let cleanupEnv: () => void;
  let mockTransporter: ReturnType<typeof createMockTransporter>;
  let mailer: AuditNotificationMailer;

  beforeEach(() => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    mailer = new AuditNotificationMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
  });

  afterEach(() => {
    cleanupEnv();
    jest.restoreAllMocks();
  });

  describe('sendAuditNotification', () => {
    it('devrait envoyer un email de notification avec le bon payload', async () => {
      await mailer.sendAuditNotification(
        buildAuditRequest({
          id: 'audit-001',
          websiteName: 'mon-site.fr',
          contactValue: 'client@example.com',
        }),
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      const call = premierMailEnvoye(mockTransporter);
      expect(call.from).toBe(DEFAULT_AUDIT_ENV.SMTP_FROM);
      expect(call.to).toBe(DEFAULT_AUDIT_ENV.CONTACT_NOTIFICATION_TO);
      expect(call.subject).toContain('audit SEO');
      expect(call.text).toContain('mon-site.fr');
      expect(call.text).toContain('EMAIL');
      expect(call.text).toContain('client@example.com');
      expect(call.html).toContain('mon-site.fr');
    });

    it('devrait ne rien faire sans transporter', async () => {
      await expect(
        new AuditNotificationMailer(null).sendAuditNotification(
          buildAuditRequest(),
        ),
      ).resolves.toBeUndefined();
    });

    it('devrait ne rien faire si CONTACT_NOTIFICATION_TO est absent', async () => {
      delete process.env.CONTACT_NOTIFICATION_TO;

      await mailer.sendAuditNotification(buildAuditRequest());

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('devrait echapper le HTML dans le corps de l email', async () => {
      await mailer.sendAuditNotification(
        buildAuditRequest({
          websiteName: '<script>alert("xss")</script>',
          contactValue: 'test@"evil".com',
        }),
      );

      attendreScriptEchappe(premierMailEnvoye(mockTransporter).html);
    });

    it('devrait propager l erreur si sendMail echoue', async () => {
      (mockTransporter.sendMail as jest.Mock).mockRejectedValue(
        new Error('SMTP error'),
      );

      await expect(
        mailer.sendAuditNotification(buildAuditRequest()),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('escapeHtml (util pure)', () => {
    it('devrait echapper tous les caracteres HTML dangereux', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      expect(escapeHtml("Tom & Jerry's <adventure>")).toBe(
        'Tom &amp; Jerry&#39;s &lt;adventure&gt;',
      );
    });
  });
});

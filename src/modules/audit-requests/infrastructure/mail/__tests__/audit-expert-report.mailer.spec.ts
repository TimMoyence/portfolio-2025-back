import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { AuditExpertReportMailer } from '../audit-expert-report.mailer';
import type { SmtpTransporter } from '../smtp-transporter.provider';

describe('AuditExpertReportMailer', () => {
  let cleanupEnv: () => void;
  let mockTransporter: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
  });

  const buildClientReport = () => ({
    executiveSummary: 'Synthese client',
    topFindings: [],
    googleVsAiMatrix: {
      googleVisibility: { score: 78, summary: 'OK Google' },
      aiVisibility: { score: 42, summary: 'A ameliorer LLMs' },
    },
    pillarScorecard: [],
    quickWins: [],
    cta: {
      title: 'CTA',
      description: 'Description',
      actionLabel: 'Action',
    },
  });

  const buildExpertReport = () => ({
    executiveSummary: 'Synthese expert detaillee',
    perPageAnalysis: [],
    crossPageFindings: [
      {
        title: 'Canonicals inconsistantes',
        severity: 'high' as const,
        affectedUrls: ['https://ex.fr/a', 'https://ex.fr/b'],
        rootCause: 'CMS genere des URLs dupliquees',
        remediation: 'Forcer canonical absolu',
      },
    ],
    priorityBacklog: [
      {
        title: 'Corriger canonicals',
        impact: 'high' as const,
        effort: 'medium' as const,
        acceptanceCriteria: ['Tous les canonicals sont absolus'],
      },
    ],
    clientEmailDraft: {
      subject: 'Resultats audit — actions prioritaires',
      body: 'Bonjour,\n\nVoici les 3 axes majeurs...\n',
    },
    internalNotes: 'Attention: le client a deja refuse une refonte.',
  });

  it('devrait envoyer le rapport expert avec PDF attache', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditExpertReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
    const pdf = Buffer.from('%PDF-1.4 expert');

    await mailer.sendExpertReport({
      websiteName: 'mon-site.fr',
      auditId: 'audit-42',
      clientContact: { method: 'EMAIL', value: 'client@example.com' },
      clientReport: buildClientReport(),
      expertReport: buildExpertReport(),
      pdfBuffer: pdf,
    });

    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.to).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
    expect(call.subject).toBe('[Audit Expert] mon-site.fr');
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments[0].content).toBe(pdf);
    expect(call.text).toContain('audit-42');
    expect(call.text).toContain('Synthese expert detaillee');
    // Inclut le draft mail client
    expect(call.text).toContain(
      'Subject : Resultats audit — actions prioritaires',
    );
    expect(call.text).toContain('Voici les 3 axes majeurs');
    // Inclut les findings cross-page
    expect(call.text).toContain('Canonicals inconsistantes');
    // Inclut le backlog
    expect(call.text).toContain('Corriger canonicals');
    // Inclut les internal notes
    expect(call.text).toContain('refuse une refonte');
  });

  it('devrait signaler un contact PHONE avec une alerte visuelle', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditExpertReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );

    await mailer.sendExpertReport({
      websiteName: 'mon-site.fr',
      auditId: 'audit-42',
      clientContact: { method: 'PHONE', value: '+33612345678' },
      clientReport: buildClientReport(),
      expertReport: buildExpertReport(),
      pdfBuffer: Buffer.from('pdf'),
    });

    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.text).toContain('TELEPHONE');
    expect(call.text).toContain('+33612345678');
    expect(call.html).toContain('appel requis');
    expect(call.html).toContain('+33612345678');
  });

  it('devrait escape le HTML dans le draft client', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditExpertReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
    const expert = {
      ...buildExpertReport(),
      clientEmailDraft: {
        subject: '<script>xss</script>',
        body: '<img src=x onerror=1>',
      },
    };

    await mailer.sendExpertReport({
      websiteName: 'mon-site.fr',
      auditId: 'audit-42',
      clientContact: { method: 'EMAIL', value: 'client@example.com' },
      clientReport: buildClientReport(),
      expertReport: expert,
      pdfBuffer: Buffer.from('pdf'),
    });

    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.html).not.toContain('<script>xss</script>');
    expect(call.html).not.toContain('<img src=x');
    expect(call.html).toContain('&lt;script&gt;xss&lt;/script&gt;');
  });

  it('devrait ne rien faire sans transporter', async () => {
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditExpertReportMailer(null);

    await expect(
      mailer.sendExpertReport({
        websiteName: 'mon-site.fr',
        auditId: 'audit-42',
        clientContact: { method: 'EMAIL', value: 'client@example.com' },
        clientReport: buildClientReport(),
        expertReport: buildExpertReport(),
        pdfBuffer: Buffer.from('pdf'),
      }),
    ).resolves.toBeUndefined();
  });
});

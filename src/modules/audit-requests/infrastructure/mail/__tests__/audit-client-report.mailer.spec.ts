import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { AuditClientReportMailer } from '../audit-client-report.mailer';
import type { SmtpTransporter } from '../smtp-transporter.provider';

describe('AuditClientReportMailer', () => {
  let cleanupEnv: () => void;
  let mockTransporter: ReturnType<typeof createMockTransporter>;

  afterEach(() => {
    cleanupEnv?.();
    jest.restoreAllMocks();
  });

  const buildClientReport = () => ({
    executiveSummary:
      'Votre site a un potentiel enorme mais quelques blocages.',
    topFindings: [
      {
        title: 'Meta descriptions manquantes',
        impact: 'Perte de CTR estimee a 15%',
        severity: 'high' as const,
      },
    ],
    googleVsAiMatrix: {
      googleVisibility: { score: 78, summary: 'Bonne indexation Google' },
      aiVisibility: { score: 42, summary: 'Peu cite par les LLMs' },
    },
    pillarScorecard: [
      { pillar: 'seo', score: 70, target: 80, status: 'warning' as const },
      {
        pillar: 'performance',
        score: 65,
        target: 80,
        status: 'warning' as const,
      },
      { pillar: 'technical', score: 85, target: 80, status: 'ok' as const },
      { pillar: 'trust', score: 60, target: 80, status: 'warning' as const },
      {
        pillar: 'conversion',
        score: 55,
        target: 80,
        status: 'critical' as const,
      },
      {
        pillar: 'aiVisibility',
        score: 40,
        target: 80,
        status: 'critical' as const,
      },
      {
        pillar: 'citationWorthiness',
        score: 50,
        target: 80,
        status: 'warning' as const,
      },
    ],
    quickWins: [
      {
        title: 'Ajouter meta descriptions',
        businessImpact: '+15% CTR',
        effort: 'low' as const,
      },
      {
        title: 'Optimiser images',
        businessImpact: 'Chargement plus rapide',
        effort: 'low' as const,
      },
      {
        title: 'Schema Organization',
        businessImpact: 'Rich results',
        effort: 'medium' as const,
      },
    ],
    cta: {
      title: 'Prenons 30 minutes',
      description: 'Pour prioriser les actions ensemble',
      actionLabel: 'Reserver un creneau',
    },
  });

  it('devrait envoyer le rapport client sans pdf', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditClientReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );

    await mailer.sendClientReport({
      to: 'client@example.com',
      firstName: 'Alice',
      websiteName: 'mon-site.fr',
      clientReport: buildClientReport(),
      pdfBuffer: null,
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.to).toBe('client@example.com');
    expect(call.subject).toBe('Votre audit Growth — mon-site.fr');
    expect(call.attachments).toBeUndefined();
    expect(call.text).toContain('Alice');
    expect(call.text).toContain('Meta descriptions manquantes');
    expect(call.text).toContain('+15% CTR');
    expect(call.html).toContain('Reserver un creneau');
    expect(call.replyTo).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
  });

  it('devrait attacher le PDF quand pdfBuffer est fourni', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditClientReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
    const pdf = Buffer.from('%PDF-1.4 fake');

    await mailer.sendClientReport({
      to: 'client@example.com',
      firstName: null,
      websiteName: 'mon-site.fr',
      clientReport: buildClientReport(),
      pdfBuffer: pdf,
    });

    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments[0].filename).toContain('mon-site-fr');
    expect(call.attachments[0].content).toBe(pdf);
    expect(call.attachments[0].contentType).toBe('application/pdf');
  });

  it('devrait escape les champs LLM contenant du HTML', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditClientReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
    const report = buildClientReport();
    const dangerousReport = {
      ...report,
      executiveSummary: '<script>alert(1)</script>',
    };

    await mailer.sendClientReport({
      to: 'client@example.com',
      firstName: null,
      websiteName: 'mon-site.fr',
      clientReport: dangerousReport,
      pdfBuffer: null,
    });

    const call = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
    expect(call.html).not.toContain('<script>alert(1)</script>');
    expect(call.html).toContain('&lt;script&gt;');
  });

  it('devrait ne rien faire si le transporter est absent', async () => {
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditClientReportMailer(null);

    await expect(
      mailer.sendClientReport({
        to: 'client@example.com',
        firstName: null,
        websiteName: 'mon-site.fr',
        clientReport: buildClientReport(),
        pdfBuffer: null,
      }),
    ).resolves.toBeUndefined();
  });

  it('devrait ne rien faire si le destinataire est vide', async () => {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    const mailer = new AuditClientReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );

    await mailer.sendClientReport({
      to: '',
      firstName: null,
      websiteName: 'mon-site.fr',
      clientReport: buildClientReport(),
      pdfBuffer: null,
    });

    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });
});

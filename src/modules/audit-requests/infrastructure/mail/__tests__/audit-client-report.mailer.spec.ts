import {
  createMockTransporter,
  premierMailEnvoye,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { AuditClientReportMailer } from '../audit-client-report.mailer';
import type { SmtpTransporter } from '../smtp-transporter.provider';

type RapportClientEnvoye = Parameters<
  AuditClientReportMailer['sendClientReport']
>[0];

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

  function buildMailer(): AuditClientReportMailer {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    return new AuditClientReportMailer(
      mockTransporter as unknown as SmtpTransporter,
    );
  }

  const sentMail = () => premierMailEnvoye(mockTransporter);

  const envoyerRapport = (
    mailer: AuditClientReportMailer,
    parametres: Partial<RapportClientEnvoye> = {},
  ) =>
    mailer.sendClientReport({
      to: 'client@example.com',
      firstName: null,
      websiteName: 'mon-site.fr',
      clientReport: buildClientReport(),
      pdfBuffer: null,
      ...parametres,
    });

  it('devrait envoyer le rapport client sans pdf', async () => {
    await envoyerRapport(buildMailer(), { firstName: 'Alice' });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const call = sentMail();
    expect(call.to).toBe('client@example.com');
    expect(call.subject).toBe('Votre audit Growth — mon-site.fr');
    expect(call.attachments).toBeUndefined();
    expect(call.text).toContain('Alice');
    expect(call.text).toContain('Meta descriptions manquantes');
    expect(call.text).toContain('+15% CTR');
    expect(call.html).toContain('Reserver un creneau');
    expect(call.replyTo).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
  });

  describe('P0.5 — CTA email cliquable', () => {
    it('rend le CTA comme un <a href> pointant vers bookingUrl quand fourni', async () => {
      await envoyerRapport(buildMailer(), {
        firstName: 'Alice',
        bookingUrl: 'https://cal.com/asili/audit-call',
      });

      const call = sentMail();
      expect(call.html).toContain('href="https://cal.com/asili/audit-call"');
      expect(call.html).toContain('target="_blank"');
      expect(call.html).toContain('rel="noopener noreferrer"');
      expect(call.text).toContain('https://cal.com/asili/audit-call');
    });

    it('fallback sur /fr/contact Asili quand aucune URL booking configuree', async () => {
      const mailer = buildMailer();
      const originalBookingUrl = process.env.AUDIT_BOOKING_URL;
      delete process.env.AUDIT_BOOKING_URL;

      try {
        await envoyerRapport(mailer);

        const call = sentMail();
        expect(call.html).toContain('href="https://asilidesign.fr/fr/contact"');
      } finally {
        if (originalBookingUrl !== undefined) {
          process.env.AUDIT_BOOKING_URL = originalBookingUrl;
        }
      }
    });
  });

  it('devrait attacher le PDF quand pdfBuffer est fourni', async () => {
    const pdf = Buffer.from('%PDF-1.4 fake');

    await envoyerRapport(buildMailer(), { pdfBuffer: pdf });

    expect(sentMail().attachments).toEqual([
      {
        filename: expect.stringContaining('mon-site-fr'),
        content: pdf,
        contentType: 'application/pdf',
      },
    ]);
  });

  it('devrait escape les champs LLM contenant du HTML', async () => {
    await envoyerRapport(buildMailer(), {
      clientReport: {
        ...buildClientReport(),
        executiveSummary: '<script>alert(1)</script>',
      },
    });

    const call = sentMail();
    expect(call.html).not.toContain('<script>alert(1)</script>');
    expect(call.html).toContain('&lt;script&gt;');
  });

  it('devrait ne rien faire si le transporter est absent', async () => {
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    await expect(
      envoyerRapport(new AuditClientReportMailer(null)),
    ).resolves.toBeUndefined();
  });

  it('devrait ne rien faire si le destinataire est vide', async () => {
    await envoyerRapport(buildMailer(), { to: '' });

    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });
});

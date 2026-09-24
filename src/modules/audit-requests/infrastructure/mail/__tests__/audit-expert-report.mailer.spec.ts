import { buildClientReportSynthesis } from '../../../../../../test/factories/audit-requests.factory';
import {
  createMockTransporter,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import type { ExpertReportMailInput } from '../../../domain/IAuditNotifier.port';
import { AuditExpertReportMailer } from '../audit-expert-report.mailer';
import type { SmtpTransporter } from '../smtp-transporter.provider';

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

const buildInput = (
  overrides: Partial<ExpertReportMailInput> = {},
): ExpertReportMailInput => ({
  websiteName: 'mon-site.fr',
  auditId: 'audit-42',
  clientContact: { method: 'EMAIL', value: 'client@example.com' },
  clientReport: buildClientReportSynthesis(),
  expertReport: buildExpertReport(),
  pdfBuffer: Buffer.from('pdf'),
  ...overrides,
});

describe('AuditExpertReportMailer', () => {
  let cleanupEnv: () => void;

  beforeEach(() => {
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
  });

  afterEach(() => {
    cleanupEnv();
    jest.restoreAllMocks();
  });

  async function envoyer(overrides: Partial<ExpertReportMailInput> = {}) {
    const transporter = createMockTransporter();
    const mailer = new AuditExpertReportMailer(
      transporter as unknown as SmtpTransporter,
    );
    await mailer.sendExpertReport(buildInput(overrides));
    return (transporter.sendMail as jest.Mock).mock.calls[0][0];
  }

  it('devrait envoyer le rapport expert avec PDF attache', async () => {
    const pdf = Buffer.from('%PDF-1.4 expert');

    const call = await envoyer({ pdfBuffer: pdf });

    expect(call.to).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
    expect(call.subject).toBe('[Audit Expert] mon-site.fr');
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments[0].content).toBe(pdf);
    expect(call.text).toContain('audit-42');
    expect(call.text).toContain('Synthese expert detaillee');
    expect(call.text).toContain(
      'Subject : Resultats audit — actions prioritaires',
    );
    expect(call.text).toContain('Voici les 3 axes majeurs');
    expect(call.text).toContain('Canonicals inconsistantes');
    expect(call.text).toContain('Corriger canonicals');
    expect(call.text).toContain('refuse une refonte');
  });

  it('devrait signaler un contact PHONE avec une alerte visuelle', async () => {
    const call = await envoyer({
      clientContact: { method: 'PHONE', value: '+33612345678' },
    });

    expect(call.text).toContain('TELEPHONE');
    expect(call.text).toContain('+33612345678');
    expect(call.html).toContain('appel requis');
    expect(call.html).toContain('+33612345678');
  });

  it('devrait escape le HTML dans le draft client', async () => {
    const call = await envoyer({
      expertReport: {
        ...buildExpertReport(),
        clientEmailDraft: {
          subject: '<script>xss</script>',
          body: '<img src=x onerror=1>',
        },
      },
    });

    expect(call.html).not.toContain('<script>xss</script>');
    expect(call.html).not.toContain('<img src=x');
    expect(call.html).toContain('&lt;script&gt;xss&lt;/script&gt;');
  });

  it('devrait ne rien faire sans transporter', async () => {
    const mailer = new AuditExpertReportMailer(null);

    await expect(
      mailer.sendExpertReport(buildInput()),
    ).resolves.toBeUndefined();
  });
});

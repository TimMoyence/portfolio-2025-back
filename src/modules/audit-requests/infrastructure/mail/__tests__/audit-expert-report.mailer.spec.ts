import {
  buildClientReportSynthesis,
  buildExpertReportConforme,
} from '../../../../../../test/factories/audit-requests.factory';
import {
  codesBrutsDuCourriel,
  createMockTransporter,
  premierMailEnvoye,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import type { ExpertReportMailInput } from '../../../domain/IAuditNotifier.port';
import { AuditExpertReportMailer } from '../audit-expert-report.mailer';
import { ExpediteurDeCourriels } from '../../../../../common/infrastructure/mail/expediteur-smtp';

const EXPERT = buildExpertReportConforme();
const [CONSTAT] = EXPERT.crossPageFindings;
const [ACTION] = EXPERT.priorityBacklog;

const buildInput = (
  overrides: Partial<ExpertReportMailInput> = {},
): ExpertReportMailInput => ({
  websiteName: 'mon-site.fr',
  auditId: 'audit-42',
  clientContact: { method: 'EMAIL', value: 'client@example.com' },
  clientReport: buildClientReportSynthesis(),
  expertReport: buildExpertReportConforme(),
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
      new ExpediteurDeCourriels(transporter),
    );
    await mailer.sendExpertReport(buildInput(overrides));
    return premierMailEnvoye(transporter);
  }

  it('envoie au destinataire des notifications quand AUDIT_REPORT_TO est vide', async () => {
    cleanupEnv();
    cleanupEnv = setSmtpEnv({ ...DEFAULT_AUDIT_ENV, AUDIT_REPORT_TO: '' });

    const call = await envoyer();

    expect(call.to).toBe(DEFAULT_AUDIT_ENV.CONTACT_NOTIFICATION_TO);
  });

  it('devrait envoyer le rapport expert avec PDF attache', async () => {
    const pdf = Buffer.from('%PDF-1.4 expert');

    const call = await envoyer({ pdfBuffer: pdf });

    expect(call.to).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
    expect(call.subject).toBe('[Audit Expert] mon-site.fr');
    expect(call.attachments).toHaveLength(1);
    expect(call.attachments?.[0]?.content).toBe(pdf);
    expect(call.text).toContain('audit-42');
    expect(call.text).toContain(EXPERT.executiveSummary);
    expect(call.text).toContain(`Subject : ${EXPERT.clientEmailDraft.subject}`);
    expect(call.text).toContain(EXPERT.clientEmailDraft.body);
    expect(call.text).toContain(CONSTAT.title);
    expect(call.text).toContain(ACTION.title);
    expect(call.text).toContain(EXPERT.internalNotes);
  });

  it('nomme la gravité, l impact et l effort par leur libellé, comme le PDF joint', async () => {
    const call = await envoyer({
      expertReport: {
        ...EXPERT,
        crossPageFindings: [{ ...CONSTAT, severity: 'critical' }],
        priorityBacklog: [{ ...ACTION, impact: 'high', effort: 'medium' }],
      },
    });

    expect(call.html).toContain(`[Critique] ${CONSTAT.title}`);
    expect(call.html).toContain('impact Élevé / effort Moyen');
    expect(call.text).toContain(`- [Critique] ${CONSTAT.title}`);
    expect(call.text).toContain('(impact Élevé / effort Moyen)');
    expect(
      codesBrutsDuCourriel(call, [
        '[CRITICAL]',
        'impact high',
        'effort medium',
      ]),
    ).toEqual([]);
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
        ...EXPERT,
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
    const mailer = new AuditExpertReportMailer(new ExpediteurDeCourriels(null));

    await expect(
      mailer.sendExpertReport(buildInput()),
    ).resolves.toBeUndefined();
  });
});

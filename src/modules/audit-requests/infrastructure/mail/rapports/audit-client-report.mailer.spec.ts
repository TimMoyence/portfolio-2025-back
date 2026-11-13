import { buildClientReportConforme } from '../../../../../../test/factories/audits/audit-requests.factory';
import {
  codesBrutsDuCourriel,
  createMockTransporter,
  premierMailEnvoye,
  setSmtpEnv,
  DEFAULT_AUDIT_ENV,
} from '../../../../../../test/factories/mailer.factory';
import { sousEnvironnement } from '../../../../../../test/helpers/depot/environnement';
import { AuditClientReportMailer } from './audit-client-report.mailer';
import { ExpediteurDeCourriels } from '../../../../../common/infrastructure/mail/expediteur-smtp';

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

  const CLIENT = buildClientReportConforme();
  const [PREMIER_QUICK_WIN, , DERNIER_QUICK_WIN] = CLIENT.quickWins;

  function buildMailer(): AuditClientReportMailer {
    mockTransporter = createMockTransporter();
    cleanupEnv = setSmtpEnv(DEFAULT_AUDIT_ENV);
    return new AuditClientReportMailer(
      new ExpediteurDeCourriels(mockTransporter),
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
      clientReport: buildClientReportConforme(),
      pdfBuffer: null,
      locale: 'fr',
      ...parametres,
    });

  it('nomme le seul hote du site dans l objet, jamais la saisie brute du demandeur', async () => {
    await envoyerRapport(buildMailer(), {
      websiteName: 'https://www.mon-site.fr/Reglez-ici?montant=500',
    });

    expect(sentMail().subject).toBe('Votre audit Growth — www.mon-site.fr');
    expect(JSON.stringify(sentMail())).not.toContain('Reglez-ici');
  });

  it('devrait envoyer le rapport client sans pdf', async () => {
    await envoyerRapport(buildMailer(), { firstName: 'Alice' });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    const call = sentMail();
    expect(call.to).toBe('client@example.com');
    expect(call.subject).toBe('Votre audit Growth — mon-site.fr');
    expect(call.attachments).toBeUndefined();
    expect(call.text).toContain('Alice');
    expect(call.text).toContain(CLIENT.topFindings[0].title);
    expect(call.text).toContain(PREMIER_QUICK_WIN.businessImpact);
    expect(call.html).toContain(CLIENT.cta.actionLabel);
    expect(call.replyTo).toBe(DEFAULT_AUDIT_ENV.AUDIT_REPORT_TO);
  });

  describe('P0.5 — CTA email cliquable', () => {
    it('rend le CTA comme un <a href> pointant vers AUDIT_BOOKING_URL', async () => {
      const mailer = buildMailer();

      await sousEnvironnement(
        { AUDIT_BOOKING_URL: ' https://cal.com/asili/audit-call ' },
        () => envoyerRapport(mailer, { firstName: 'Alice' }),
      );

      const call = sentMail();
      expect(call.html).toContain('href="https://cal.com/asili/audit-call"');
      expect(call.html).toContain('target="_blank"');
      expect(call.html).toContain('rel="noopener noreferrer"');
      expect(call.text).toContain('https://cal.com/asili/audit-call');
    });

    it('fallback sur /fr/contact Asili quand aucune URL booking configuree', async () => {
      const mailer = buildMailer();

      await sousEnvironnement({ AUDIT_BOOKING_URL: undefined }, () =>
        envoyerRapport(mailer),
      );

      expect(sentMail().html).toContain(
        'href="https://asilidesign.fr/fr/contact"',
      );
    });
  });

  it('nomme le statut de chaque pilier par son libellé, comme le PDF joint', async () => {
    await envoyerRapport(buildMailer(), {
      clientReport: {
        ...CLIENT,
        pillarScorecard: CLIENT.pillarScorecard.map((pilier) =>
          pilier.pillar === 'technical' ? { ...pilier, score: 90 } : pilier,
        ),
      },
    });

    const call = sentMail();
    for (const libelle of ['Critique', 'À améliorer', 'Objectif atteint']) {
      expect(call.html).toContain(`>${libelle}</td>`);
    }
    expect(call.text).toContain('SEO: 62/85 (À améliorer)');
    expect(call.text).toContain('Conversion: 60/85 (À améliorer)');
    expect(call.text).toContain('Citabilité IA: 52/85 (Critique)');
    expect(call.text).toContain('Visibilité IA: 48/85 (Critique)');
    expect(call.text).toContain('Tech & scalabilité: 90/85 (Objectif atteint)');
    expect(
      codesBrutsDuCourriel(call, ['warning', 'critical', '(ok)', '>ok<']),
    ).toEqual([]);
  });

  it('nomme la gravité d un constat et l effort d un quick win par leur libellé, comme le PDF joint', async () => {
    await envoyerRapport(buildMailer());

    const call = sentMail();
    expect(call.html).toContain('[Élevé] Meta descriptions manquantes');
    expect(call.html).toContain('<em>Effort : Faible</em>');
    expect(call.html).toContain('<em>Effort : Moyen</em>');
    expect(call.text).toContain('- [Élevé] Meta descriptions manquantes');
    expect(call.text).toContain(
      `- ${PREMIER_QUICK_WIN.title} (Effort : Faible)`,
    );
    expect(call.text).toContain(
      `- ${DERNIER_QUICK_WIN.title} (Effort : Moyen)`,
    );
    expect(
      codesBrutsDuCourriel(call, [
        '[HIGH]',
        '(low)',
        '(medium)',
        '>low<',
        '>medium<',
      ]),
    ).toEqual([]);
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
        ...CLIENT,
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
      envoyerRapport(
        new AuditClientReportMailer(new ExpediteurDeCourriels(null)),
      ),
    ).resolves.toBeUndefined();
  });

  it('devrait ne rien faire si le destinataire est vide', async () => {
    await envoyerRapport(buildMailer(), { to: '' });

    expect(mockTransporter.sendMail).not.toHaveBeenCalled();
  });

  it('REF-03 · nomme en anglais chaque pilier connu, et par sa clé un pilier inconnu', async () => {
    await envoyerRapport(buildMailer(), {
      locale: 'en',
      clientReport: {
        ...CLIENT,
        pillarScorecard: [
          ...CLIENT.pillarScorecard,
          { ...CLIENT.pillarScorecard[0], pillar: 'toString' },
        ],
      },
    });

    const { html, text } = sentMail();
    for (const libelle of [
      'SEO',
      'Conversion',
      'AI citability',
      'AI visibility',
      'Tech & scalability',
    ]) {
      expect(String(text)).toContain(`- ${libelle}: `);
    }
    expect(String(text)).toContain('- toString: ');
    expect(String(html)).toContain('>AI visibility</td>');
  });

  it('VIS-01 · redige en anglais le rapport d un audit demande depuis la page anglaise', async () => {
    await envoyerRapport(buildMailer(), {
      firstName: 'Jane',
      locale: 'en',
    });

    const { subject, html, text } = sentMail();
    expect(subject).toBe('Your Growth audit — mon-site.fr');
    expect(String(html)).toContain('lang="en"');
    expect(String(html)).toContain('Hello Jane,');
    expect(String(html)).toContain('Google vs AI visibility');
    expect(String(html)).toContain('Stop receiving this type of email');
    expect(String(text)).toContain('7-pillar scorecard:');
    expect(`${String(html)}${String(text)}`).not.toMatch(
      /Bonjour|Votre audit|Pilier|Visibilité|Ne plus recevoir|lang="fr"/,
    );
  });
});

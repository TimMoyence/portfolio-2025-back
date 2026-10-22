import {
  ReportQualityGateContext,
  ReportQualityGateService,
} from './report-quality-gate.service';
import { NOMBRE_DE_PRIORITES } from './audit-thresholds.config';
import type { ExpertReport } from './schemas/audit-report.schemas';
import {
  buildExpertReport,
  buildPageAnalysee,
} from '../../../../../test/factories/audit-requests.factory';

describe('ReportQualityGateService', () => {
  let service: ReportQualityGateService;

  beforeEach(() => {
    service = new ReportQualityGateService();
  });

  const baseContext = (): ReportQualityGateContext => ({
    locale: 'en',
    websiteName: 'example.com',
    normalizedUrl: 'https://example.com',
    quickWins: [
      'Fix missing title tags on core templates',
      'Fix missing meta descriptions on commercial pages',
      'Reduce TTFB on top landing pages',
    ],
    pillarScores: {
      seo: 58,
      performance: 62,
      technical: 68,
      trust: 70,
      conversion: 72,
    },
    deepFindings: [
      {
        title: 'Missing title tags',
        description: 'Several URLs are missing title tags.',
        recommendation: 'Add unique title tags to each strategic page.',
        severity: 'high',
        impact: 'traffic',
      },
      {
        title: 'Duplicate meta descriptions',
        description: 'Meta descriptions are duplicated across templates.',
        recommendation: 'Generate unique meta descriptions per intent cluster.',
        severity: 'medium',
        impact: 'traffic',
      },
    ],
  });

  it('nettoie et dedoublonne chaque liste de textes du rapport, bornes de l empreinte comprises', () => {
    const indices = Array.from({ length: 9 }, (_, i) => `Hint ${i + 1}`);
    const report = buildExpertReport();
    report.strengths = [' Strong baseline ', 'Strong baseline', ''];
    report.techFingerprint = {
      ...report.techFingerprint,
      evidence: ['wp-content path', ' wp-content path', ...indices],
      alternatives: ['PHP runtime', 'PHP runtime ', '  '],
      unknowns: ['CDN vendor', 'CDN vendor'],
    };
    report.implementationBacklog = [
      {
        task: 'Unify canonicals',
        priority: 'high',
        details: 'One self-referencing canonical per page.',
        estimatedHours: 4,
        dependencies: ['CMS access', 'CMS access '],
        acceptanceCriteria: ['Single canonical', 'Single canonical'],
      },
    ];

    const { report: normalise } = service.apply(
      'Summary text.',
      report,
      baseContext(),
    );

    expect(normalise.strengths).toEqual(['Strong baseline']);
    expect(normalise.techFingerprint).toEqual(
      expect.objectContaining({
        evidence: ['wp-content path', ...indices.slice(0, 7)],
        alternatives: ['PHP runtime'],
        unknowns: ['CDN vendor'],
      }),
    );
    expect(normalise.implementationBacklog[0]).toEqual(
      expect.objectContaining({
        dependencies: ['CMS access'],
        acceptanceCriteria: ['Single canonical'],
      }),
    );
  });

  it('enriches and deduplicates priorities up to the minimum threshold', () => {
    const report = buildExpertReport();
    report.priorities = [
      report.priorities[0],
      { ...report.priorities[0] },
      {
        title: '',
        severity: 'medium',
        whyItMatters: '',
        recommendedFix: '',
        estimatedHours: 0,
      },
    ];

    const result = service.apply(
      'English summary for business stakeholders.',
      report,
      baseContext(),
    );

    expect(result.report.priorities.length).toBeGreaterThanOrEqual(
      NOMBRE_DE_PRIORITES.min,
    );
    expect(result.report.priorities.length).toBeLessThanOrEqual(
      NOMBRE_DE_PRIORITES.max,
    );
    const titles = result.report.priorities.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('complète les priorités par les constats les plus graves d abord', () => {
    const report = buildExpertReport();
    report.priorities = [];
    const context = baseContext();
    context.deepFindings = [...context.deepFindings].reverse();

    const result = service.apply(
      'English summary for business stakeholders.',
      report,
      context,
    );

    expect(
      result.report.priorities.slice(0, 2).map((entry) => entry.title),
    ).toEqual(['Missing title tags', 'Duplicate meta descriptions']);
  });

  it.each([
    ['vide', { subject: '', body: '' }],
    ['blanc', { subject: '   ', body: 'Corps du message.' }],
  ])('refuse un brouillon d email client %s', (_cas, clientEmailDraft) => {
    const report = { ...buildExpertReport(), clientEmailDraft };

    const result = service.apply('English summary.', report, baseContext());

    expect(result.reasons).toContain('missing_client_email_draft');
    expect(result.report.clientEmailDraft).toEqual({ subject: '', body: '' });
  });

  it.each([
    [
      'fr',
      'Non verifiable',
      {
        conversionAndClarity: 'Conversion et clarte: Non verifiable.',
        speedAndPerformance: 'Vitesse et performance: Non verifiable.',
        seoFoundations: 'Fondations SEO: Non verifiable.',
        credibilityAndTrust: 'Crédibilité et confiance: Non verifiable.',
        techAndScalability: 'Tech et scalabilité: Non verifiable.',
        scorecardAndBusinessOpportunities:
          'Scorecard et opportunités business: Non verifiable.',
      },
    ],
    [
      'en',
      'Not verifiable',
      {
        conversionAndClarity: 'Conversion and clarity: Not verifiable.',
        speedAndPerformance: 'Speed and performance: Not verifiable.',
        seoFoundations: 'SEO foundations: Not verifiable.',
        credibilityAndTrust: 'Credibility and trust: Not verifiable.',
        techAndScalability: 'Tech and scalability: Not verifiable.',
        scorecardAndBusinessOpportunities:
          'Scorecard and business opportunities: Not verifiable.',
      },
    ],
  ] as const)(
    'marque non verifiable en %s les chapitres et la stack que le LLM laisse vides',
    (locale, marqueur, chapitres) => {
      const report: ExpertReport = {
        ...buildExpertReport(),
        diagnosticChapters: {
          conversionAndClarity: '',
          speedAndPerformance: ' ',
          seoFoundations: '',
          credibilityAndTrust: '',
          techAndScalability: '',
          scorecardAndBusinessOpportunities: '',
        },
        techFingerprint: {
          ...buildExpertReport().techFingerprint,
          primaryStack: '',
        },
      };

      const result = service.apply('Summary.', report, {
        ...baseContext(),
        locale,
      });

      expect(result.report.diagnosticChapters).toEqual(chapitres);
      expect(result.report.techFingerprint.primaryStack).toBe(marqueur);
    },
  );

  it('garde un brouillon d email client trimé', () => {
    const report = {
      ...buildExpertReport(),
      clientEmailDraft: { subject: ' Objet ', body: ' Corps. ' },
    };

    const result = service.apply('English summary.', report, baseContext());

    expect(result.reasons).not.toContain('missing_client_email_draft');
    expect(result.report.clientEmailDraft).toEqual({
      subject: 'Objet',
      body: 'Corps.',
    });
  });

  it('ranks the model severity into the three report levels', () => {
    const report = buildExpertReport();
    const priority = report.priorities[0];
    report.priorities = [
      {
        ...priority,
        title: 'Critical canonical defect',
        severity: 'CRITICAL' as never,
      },
      { ...priority, title: 'Low canonical defect', severity: 'Low' as never },
      {
        ...priority,
        title: 'Unknown canonical defect',
        severity: 'urgent' as never,
      },
    ];

    const result = service.apply(
      'English summary for business stakeholders.',
      report,
      baseContext(),
    );

    const severityOf = (title: string): string | undefined =>
      result.report.priorities.find((entry) => entry.title === title)?.severity;
    expect(severityOf('Critical canonical defect')).toBe('high');
    expect(severityOf('Low canonical defect')).toBe('low');
    expect(severityOf('Unknown canonical defect')).toBe('medium');
  });

  describe('validateurs du palier expert', () => {
    const rapportExpertComplet = (): ExpertReport => ({
      ...buildExpertReport(),
      perPageAnalysis: [buildPageAnalysee({ url: 'https://example.com/' })],
      clientEmailDraft: {
        subject: 'Audit example.com: quick wins',
        body: 'Hello,\n\n'.repeat(50),
      },
      internalNotes: 'Internal notes ready for the call.',
    });

    const appliquer = (report: ExpertReport) =>
      service.apply('English summary.', report, baseContext());

    const motifsDuPalier = (reasons: readonly string[]) =>
      reasons.filter((reason) => reason.startsWith('expert_report_'));

    it('garde un rapport expert avec fiches pages, brouillon et notes internes', () => {
      const result = appliquer(rapportExpertComplet());

      expect(motifsDuPalier(result.reasons)).toEqual([]);
      expect(result.repli).toBe(false);
    });

    it('demande le repli sans fiche page, sans notes internes et avec un corps court', () => {
      const result = appliquer({
        ...rapportExpertComplet(),
        perPageAnalysis: [],
        clientEmailDraft: { subject: 'Short', body: 'Too short.' },
        internalNotes: '',
      });

      expect(result.valid).toBe(false);
      expect(motifsDuPalier(result.reasons)).toEqual([
        'expert_report_per_page_analysis_missing',
        'expert_report_client_email_body_too_short',
        'expert_report_internal_notes_missing',
      ]);
      expect(result.repli).toBe(true);
    });

    it('demande le repli pour un objet de courriel trop long', () => {
      const result = appliquer({
        ...rapportExpertComplet(),
        clientEmailDraft: {
          subject: 'A'.repeat(120),
          body: 'Hello,\n\n'.repeat(50),
        },
      });

      expect(result.valid).toBe(false);
      expect(motifsDuPalier(result.reasons)).toEqual([
        'expert_report_client_email_subject_too_long',
      ]);
      expect(result.repli).toBe(true);
    });
  });

  it('flags mixed-language output as invalid', () => {
    const report = buildExpertReport();
    report.executiveSummary =
      'The audit is ready et la priorite est la conversion.';

    const result = service.apply(
      'The website performs well et il faut corriger les metas.',
      report,
      baseContext(),
    );

    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('language_mismatch_detected');
  });
});

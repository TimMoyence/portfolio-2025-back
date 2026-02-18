import {
  ExpertReportShape,
  ReportQualityGateContext,
  ReportQualityGateService,
} from './report-quality-gate.service';

describe('ReportQualityGateService', () => {
  let service: ReportQualityGateService;

  beforeEach(() => {
    service = new ReportQualityGateService();
  });

  const baseReport = (): ExpertReportShape => ({
    executiveSummary: 'Executive summary.',
    reportExplanation: 'Report explanation.',
    strengths: ['Strong technical baseline'],
    priorities: [
      {
        title: 'Fix canonical consistency',
        severity: 'high',
        whyItMatters: 'Canonical defects split ranking signals.',
        recommendedFix:
          'Set one self-referencing canonical per indexable page.',
        estimatedHours: 5,
      },
    ],
    urlLevelImprovements: [],
    implementationTodo: [],
    whatToFixThisWeek: [],
    whatToFixThisMonth: [],
    clientMessageTemplate: 'Hello, here are top priorities.',
    clientLongEmail: 'Detailed client email.',
    fastImplementationPlan: [],
    implementationBacklog: [],
    invoiceScope: [],
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

  it('enriches and deduplicates priorities up to the minimum threshold', () => {
    const report = baseReport();
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

    expect(result.report.priorities.length).toBeGreaterThanOrEqual(10);
    const titles = result.report.priorities.map((entry) => entry.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('flags mixed-language output as invalid', () => {
    const report = baseReport();
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

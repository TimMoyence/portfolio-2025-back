import type { ClientReportSynthesis } from '../../domain/AuditReportTiers';
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
    diagnosticChapters: {
      conversionAndClarity: 'Conversion issues detected on key templates.',
      speedAndPerformance: 'Performance bottlenecks affect mobile rendering.',
      seoFoundations: 'Metadata and heading structure need standardization.',
      credibilityAndTrust: 'Trust signals are inconsistent across core pages.',
      techAndScalability:
        'Stack hygiene requires stronger maintenance controls.',
      scorecardAndBusinessOpportunities:
        'Prioritized quick wins can improve leads in 30 days.',
    },
    techFingerprint: {
      primaryStack: 'WordPress',
      confidence: 0.78,
      evidence: ['WordPress hint detected'],
      alternatives: ['PHP runtime'],
      unknowns: [],
    },
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
    perPageAnalysis: [],
    clientEmailDraft: { subject: '', body: '' },
    internalNotes: '',
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

  const baseClientReport = (): ClientReportSynthesis => ({
    executiveSummary:
      'Audit complet finalise avec 3 leviers prioritaires et un plan de 30 jours.',
    topFindings: [
      {
        title: 'Meta descriptions manquantes',
        impact: 'Reduction du CTR organique sur les pages commerciales.',
        severity: 'high',
      },
      {
        title: 'CTA peu visible',
        impact: 'Baisse du taux de conversion sur les pages de landing.',
        severity: 'medium',
      },
    ],
    googleVsAiMatrix: {
      googleVisibility: { score: 65, summary: 'Bon potentiel Google.' },
      aiVisibility: { score: 50, summary: 'Couverture IA a renforcer.' },
    },
    pillarScorecard: [
      { pillar: 'seo', score: 62, target: 85, status: 'warning' },
      { pillar: 'performance', score: 55, target: 85, status: 'warning' },
      { pillar: 'technical', score: 70, target: 85, status: 'warning' },
      { pillar: 'trust', score: 68, target: 85, status: 'warning' },
      { pillar: 'conversion', score: 60, target: 85, status: 'warning' },
      { pillar: 'aiVisibility', score: 48, target: 85, status: 'critical' },
      {
        pillar: 'citationWorthiness',
        score: 52,
        target: 85,
        status: 'critical',
      },
    ],
    quickWins: [
      {
        title: 'Ajouter les meta descriptions',
        businessImpact: 'Augmente le CTR organique rapidement.',
        effort: 'low',
      },
      {
        title: 'Repositionner le CTA principal',
        businessImpact: 'Ameliore la conversion mobile.',
        effort: 'low',
      },
      {
        title: 'Publier un fichier llms.txt',
        businessImpact: 'Ouvre la visibilite aux moteurs IA.',
        effort: 'medium',
      },
    ],
    cta: {
      title: 'Planifier un appel de 30 minutes',
      description: 'Nous prioriserons ensemble les premieres actions.',
      actionLabel: 'Reserver',
    },
  });

  describe('validateClientReport', () => {
    it('accepts a valid client synthesis with 7 pillars and 3 quick wins', () => {
      const result = service.validateClientReport(baseClientReport());
      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.shouldFallback).toBe(false);
    });

    it('flags a scorecard that is not exactly 7 entries', () => {
      const bad = baseClientReport();
      const mutable = {
        ...bad,
        pillarScorecard: bad.pillarScorecard.slice(0, 5),
      };
      const result = service.validateClientReport(mutable);
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.includes('pillar_scorecard')),
      ).toBe(true);
      expect(result.shouldFallback).toBe(true);
    });

    it('flags quickWins when too few or too many', () => {
      const few = baseClientReport();
      const mutable = { ...few, quickWins: few.quickWins.slice(0, 1) };
      const result = service.validateClientReport(mutable);
      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('quick_wins'))).toBe(
        true,
      );
    });

    it('flags an incomplete CTA', () => {
      const report = baseClientReport();
      const mutable = {
        ...report,
        cta: { ...report.cta, actionLabel: '' },
      };
      const result = service.validateClientReport(mutable);
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.includes('cta_incomplete')),
      ).toBe(true);
    });

    it('flags markdown leakage in executive summary', () => {
      const report = baseClientReport();
      const mutable = {
        ...report,
        executiveSummary: '**Executive summary** with markdown bold.',
      };
      const result = service.validateClientReport(mutable);
      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('markdown'))).toBe(
        true,
      );
    });
  });

  describe('validateExpertReport', () => {
    it('accepts a valid expert report with perPageAnalysis, draft and notes', () => {
      const result = service.validateExpertReport({
        perPageAnalysis: [{ url: 'https://example.com/' }],
        clientEmailDraft: {
          subject: 'Audit example.com: quick wins',
          body: 'Hello,\n\n'.repeat(50),
        },
        internalNotes: 'Internal notes ready for the call.',
      });
      expect(result.valid).toBe(true);
      expect(result.shouldFallback).toBe(false);
    });

    it('flags empty perPageAnalysis and short body', () => {
      const result = service.validateExpertReport({
        perPageAnalysis: [],
        clientEmailDraft: { subject: 'Short', body: 'Too short.' },
        internalNotes: '',
      });
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.includes('per_page_analysis')),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.includes('body_too_short')),
      ).toBe(true);
      expect(
        result.issues.some((issue) => issue.includes('internal_notes')),
      ).toBe(true);
      expect(result.shouldFallback).toBe(true);
    });

    it('flags an overly long subject', () => {
      const longSubject = 'A'.repeat(120);
      const result = service.validateExpertReport({
        perPageAnalysis: [{ url: 'https://example.com/' }],
        clientEmailDraft: {
          subject: longSubject,
          body: 'Hello,\n\n'.repeat(50),
        },
        internalNotes: 'ok',
      });
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.includes('subject_too_long')),
      ).toBe(true);
    });
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

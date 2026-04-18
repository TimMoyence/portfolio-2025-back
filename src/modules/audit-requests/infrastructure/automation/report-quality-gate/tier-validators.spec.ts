import { validateClientReport, validateExpertReport } from './tier-validators';
import type { ClientReportSynthesis } from '../../../domain/AuditReportTiers';

function buildClientReport(
  overrides?: Partial<ClientReportSynthesis>,
): ClientReportSynthesis {
  return {
    executiveSummary: 'Synthese operationnelle du rapport client.',
    pillarScorecard: [
      { pillar: 'seo', score: 70, label: 'SEO', color: 'green' },
      { pillar: 'performance', score: 65, label: 'Perf', color: 'orange' },
      { pillar: 'technical', score: 70, label: 'Tech', color: 'green' },
      { pillar: 'trust', score: 60, label: 'Trust', color: 'orange' },
      { pillar: 'conversion', score: 70, label: 'Conv', color: 'green' },
      {
        pillar: 'aiVisibility',
        score: 50,
        label: 'AI visibility',
        color: 'orange',
      },
      {
        pillar: 'citationWorthiness',
        score: 55,
        label: 'Citation',
        color: 'orange',
      },
    ],
    quickWins: [
      { title: 'Quick win A', businessImpact: 'Gain', details: '' },
      { title: 'Quick win B', businessImpact: 'Gain', details: '' },
      { title: 'Quick win C', businessImpact: 'Gain', details: '' },
    ],
    topFindings: [
      { title: 'Top finding A', description: 'Desc', severity: 'high' },
    ],
    cta: {
      title: 'Parler du projet',
      description: 'Contactez-nous pour avancer',
      actionLabel: 'Prendre RDV',
    },
    ...overrides,
  } as unknown as ClientReportSynthesis;
}

describe('validateClientReport', () => {
  it('valide un rapport client correctement forme', () => {
    const result = validateClientReport(buildClientReport());
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.shouldFallback).toBe(false);
  });

  it('rejette quand executiveSummary est vide', () => {
    const result = validateClientReport(
      buildClientReport({ executiveSummary: '' }),
    );
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('client_report_missing_executive_summary');
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette quand executiveSummary contient du markdown interdit', () => {
    const result = validateClientReport(
      buildClientReport({
        executiveSummary: '## Titre markdown interdit ici',
      }),
    );
    expect(result.issues).toContain(
      'client_report_markdown_in_executive_summary',
    );
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette pillarScorecard de mauvaise longueur', () => {
    const report = buildClientReport();
    (report as { pillarScorecard: unknown }).pillarScorecard = [];
    const result = validateClientReport(report);
    expect(result.issues).toContain(
      'client_report_pillar_scorecard_must_have_exactly_7_entries',
    );
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette quickWins hors plage 3-5', () => {
    const result = validateClientReport(buildClientReport({ quickWins: [] }));
    expect(result.issues).toContain(
      'client_report_quick_wins_must_be_between_3_and_5',
    );
  });

  it('rejette quand un quickWin a un champ obligatoire vide', () => {
    const result = validateClientReport(
      buildClientReport({
        quickWins: [
          { title: '', businessImpact: 'Gain', details: '' },
          { title: 'A', businessImpact: 'B', details: '' },
          { title: 'C', businessImpact: 'D', details: '' },
        ],
      } as unknown as Partial<ClientReportSynthesis>),
    );
    expect(result.issues).toContain('client_report_quick_win_missing_fields');
  });

  it('rejette quand CTA est incomplet', () => {
    const result = validateClientReport(
      buildClientReport({
        cta: { title: '', description: '', actionLabel: '' },
      } as unknown as Partial<ClientReportSynthesis>),
    );
    expect(result.issues).toContain('client_report_cta_incomplete');
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette topFindings trop longs (> 5) sans fallback fort', () => {
    const result = validateClientReport(
      buildClientReport({
        topFindings: Array.from({ length: 6 }, (_, i) => ({
          title: `Finding ${i}`,
          description: 'Desc',
          severity: 'medium',
        })),
      } as unknown as Partial<ClientReportSynthesis>),
    );
    expect(result.issues).toContain(
      'client_report_top_findings_exceeds_maximum',
    );
  });
});

describe('validateExpertReport', () => {
  function buildExpertReport(
    overrides?: Partial<{
      perPageAnalysis: unknown[];
      clientEmailDraft: { subject: string; body: string } | null;
      internalNotes: string;
    }>,
  ) {
    return {
      perPageAnalysis: [{ url: '/a' }],
      clientEmailDraft: {
        subject: 'Sujet',
        body: 'Body '.repeat(50),
      },
      internalNotes: 'Notes internes detaillees',
      ...overrides,
    };
  }

  it('valide un rapport expert correctement forme', () => {
    const result = validateExpertReport(buildExpertReport());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('rejette perPageAnalysis vide', () => {
    const result = validateExpertReport(
      buildExpertReport({ perPageAnalysis: [] }),
    );
    expect(result.issues).toContain('expert_report_per_page_analysis_missing');
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette clientEmailDraft manquant', () => {
    const result = validateExpertReport(
      buildExpertReport({ clientEmailDraft: null }),
    );
    expect(result.issues).toContain('expert_report_client_email_draft_missing');
    expect(result.shouldFallback).toBe(true);
  });

  it('rejette subject email trop long', () => {
    const result = validateExpertReport(
      buildExpertReport({
        clientEmailDraft: {
          subject: 'x'.repeat(120),
          body: 'Body '.repeat(50),
        },
      }),
    );
    expect(result.issues).toContain(
      'expert_report_client_email_subject_too_long',
    );
  });

  it('rejette body trop court (<= 200)', () => {
    const result = validateExpertReport(
      buildExpertReport({
        clientEmailDraft: {
          subject: 'Sujet',
          body: 'Court',
        },
      }),
    );
    expect(result.issues).toContain(
      'expert_report_client_email_body_too_short',
    );
  });

  it('rejette internalNotes vide', () => {
    const result = validateExpertReport(
      buildExpertReport({ internalNotes: '' }),
    );
    expect(result.issues).toContain('expert_report_internal_notes_missing');
    expect(result.shouldFallback).toBe(true);
  });
});

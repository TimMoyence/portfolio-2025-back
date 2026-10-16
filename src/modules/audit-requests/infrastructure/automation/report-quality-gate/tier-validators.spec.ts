import { validateClientReport, validateExpertReport } from './tier-validators';
import type {
  ClientReportSynthesis,
  ExpertReportSynthesis,
} from '../../../domain/AuditReportTiers';
import {
  attendreRapportAccepte,
  attendreRapportRefuse,
} from '../../../../../../test/helpers/validation-de-rapport';
import {
  buildClientReportConforme,
  buildExpertReportConforme,
} from '../../../../../../test/factories/audit-requests.factory';

type RapportExpertLu = Parameters<typeof validateExpertReport>[0];

describe('validateClientReport', () => {
  it('accepte le rapport client conforme, ses 7 piliers et ses 3 quick wins', () => {
    attendreRapportAccepte(validateClientReport(buildClientReportConforme()));
  });

  it.each<
    [
      string,
      (conforme: ClientReportSynthesis) => Partial<ClientReportSynthesis>,
      string,
    ]
  >([
    [
      'un résumé vide',
      () => ({ executiveSummary: '' }),
      'client_report_missing_executive_summary',
    ],
    [
      'du Markdown dans le résumé',
      () => ({ executiveSummary: '## Titre markdown interdit ici' }),
      'client_report_markdown_in_executive_summary',
    ],
    [
      '5 piliers au lieu de 7',
      (conforme) => ({ pillarScorecard: conforme.pillarScorecard.slice(0, 5) }),
      'client_report_pillar_scorecard_must_have_exactly_7_entries',
    ],
    [
      '7 piliers sans le SEO',
      (conforme) => ({
        pillarScorecard: [
          ...conforme.pillarScorecard.slice(1),
          conforme.pillarScorecard[1],
        ],
      }),
      'client_report_missing_pillar_seo',
    ],
    [
      '2 quick wins',
      (conforme) => ({ quickWins: conforme.quickWins.slice(0, 2) }),
      'client_report_quick_wins_must_be_between_3_and_5',
    ],
    [
      '6 quick wins',
      (conforme) => ({
        quickWins: [...conforme.quickWins, ...conforme.quickWins],
      }),
      'client_report_quick_wins_must_be_between_3_and_5',
    ],
    [
      'un quick win sans titre',
      (conforme) => ({
        quickWins: conforme.quickWins.map((quickWin, rang) =>
          rang === 0 ? { ...quickWin, title: ' ' } : quickWin,
        ),
      }),
      'client_report_quick_win_missing_fields',
    ],
    [
      'un CTA sans libellé d action',
      (conforme) => ({ cta: { ...conforme.cta, actionLabel: '' } }),
      'client_report_cta_incomplete',
    ],
    [
      'aucun constat',
      () => ({ topFindings: [] }),
      'client_report_missing_top_findings',
    ],
    [
      '6 constats',
      (conforme) => ({
        topFindings: Array.from({ length: 6 }, () => conforme.topFindings[0]),
      }),
      'client_report_top_findings_exceeds_maximum',
    ],
    [
      'du Markdown dans le titre d un constat',
      (conforme) => ({
        topFindings: [{ ...conforme.topFindings[0], title: '## Constat' }],
      }),
      'client_report_markdown_in_finding_title',
    ],
  ])('rejette un rapport client avec %s', (_cas, alteration, motif) => {
    const conforme = buildClientReportConforme();

    attendreRapportRefuse(
      validateClientReport({ ...conforme, ...alteration(conforme) }),
      motif,
    );
  });
});

describe('validateExpertReport', () => {
  it('accepte le rapport expert conforme', () => {
    attendreRapportAccepte(validateExpertReport(buildExpertReportConforme()));
  });

  it.each<
    [string, (conforme: ExpertReportSynthesis) => RapportExpertLu, string]
  >([
    [
      'aucune fiche page',
      () => ({ perPageAnalysis: [] }),
      'expert_report_per_page_analysis_missing',
    ],
    [
      'aucun brouillon de courriel',
      () => ({ clientEmailDraft: null }),
      'expert_report_client_email_draft_missing',
    ],
    [
      'un objet de courriel vide',
      (conforme) => ({
        clientEmailDraft: { ...conforme.clientEmailDraft, subject: ' ' },
      }),
      'expert_report_client_email_subject_empty',
    ],
    [
      'un objet de courriel de 100 caractères',
      (conforme) => ({
        clientEmailDraft: {
          ...conforme.clientEmailDraft,
          subject: 'x'.repeat(100),
        },
      }),
      'expert_report_client_email_subject_too_long',
    ],
    [
      'un corps de courriel vide',
      (conforme) => ({
        clientEmailDraft: { ...conforme.clientEmailDraft, body: '' },
      }),
      'expert_report_client_email_body_empty',
    ],
    [
      'un corps de courriel de 200 caractères',
      (conforme) => ({
        clientEmailDraft: {
          ...conforme.clientEmailDraft,
          body: 'x'.repeat(200),
        },
      }),
      'expert_report_client_email_body_too_short',
    ],
    [
      'des notes internes vides',
      () => ({ internalNotes: ' ' }),
      'expert_report_internal_notes_missing',
    ],
  ])('rejette un rapport expert avec %s', (_cas, alteration, motif) => {
    const conforme = buildExpertReportConforme();

    attendreRapportRefuse(
      validateExpertReport({ ...conforme, ...alteration(conforme) }),
      motif,
    );
  });
});

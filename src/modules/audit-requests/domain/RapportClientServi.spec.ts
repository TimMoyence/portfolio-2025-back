import { buildClientReportSynthesis } from '../../../../test/factories/audit-requests.factory';
import type { ClientReportSynthesis } from './AuditReportTiers';
import { rapportClientServi } from './RapportClientServi';

type PilierLivre = ClientReportSynthesis['pillarScorecard'][number];

const rapportLivre = (
  pillarScorecard: readonly PilierLivre[],
): ClientReportSynthesis => ({
  ...buildClientReportSynthesis(),
  pillarScorecard,
});

describe('rapportClientServi', () => {
  it('B-68 · sert le statut et le libellé de chaque pilier face à sa cible affichée, recalculés pour un rapport déjà livré', () => {
    const livre = rapportLivre([
      { pillar: 'seo', score: 84, target: 85, status: 'ok' } as PilierLivre,
      {
        pillar: 'trust',
        score: 70,
        target: 65,
        status: 'warning',
      } as PilierLivre,
      { pillar: 'conversion', score: 40, target: 85 },
    ]);

    expect(rapportClientServi(livre, 'fr').pillarScorecard).toEqual([
      {
        pillar: 'seo',
        score: 84,
        target: 85,
        status: 'warning',
        statusLabel: 'À améliorer',
      },
      {
        pillar: 'trust',
        score: 70,
        target: 65,
        status: 'ok',
        statusLabel: 'Objectif atteint',
      },
      {
        pillar: 'conversion',
        score: 40,
        target: 85,
        status: 'critical',
        statusLabel: 'Critique',
      },
    ]);
  });

  it('B-68 · sert le statut de la matrice Google / IA sans cible, sur 80 et 55, dans la langue de l audit', () => {
    const livre: ClientReportSynthesis = {
      ...buildClientReportSynthesis(),
      googleVsAiMatrix: {
        googleVisibility: { score: 80, summary: 'Bon socle.' },
        aiVisibility: { score: 79, summary: 'À renforcer.' },
      },
    };

    expect(rapportClientServi(livre, 'en').googleVsAiMatrix).toEqual({
      googleVisibility: {
        score: 80,
        summary: 'Bon socle.',
        status: 'ok',
        statusLabel: 'Target met',
      },
      aiVisibility: {
        score: 79,
        summary: 'À renforcer.',
        status: 'warning',
        statusLabel: 'Needs improvement',
      },
    });
  });

  it('sert le reste du rapport tel qu il a été livré', () => {
    const livre = buildClientReportSynthesis();
    const { executiveSummary, topFindings, quickWins, cta } =
      rapportClientServi(livre, 'fr');

    expect({ executiveSummary, topFindings, quickWins, cta }).toEqual({
      executiveSummary: livre.executiveSummary,
      topFindings: livre.topFindings,
      quickWins: livre.quickWins,
      cta: livre.cta,
    });
  });
});

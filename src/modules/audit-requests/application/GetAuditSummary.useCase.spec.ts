import { NotFoundException } from '@nestjs/common';
import { GetAuditSummaryUseCase } from './GetAuditSummary.useCase';

describe('GetAuditSummaryUseCase', () => {
  it('returns persisted summary when audit exists', async () => {
    const summary = {
      auditId: 'audit-1',
      ready: true,
      status: 'COMPLETED' as const,
      progress: 100,
      summaryText: 'Résumé prêt',
      keyChecks: { accessibility: { https: true } },
      quickWins: ['Ajouter des données structurées'],
      pillarScores: { seo: 80 },
    };
    const repo = {
      findSummaryById: jest.fn().mockResolvedValue(summary),
    };
    const useCase = new GetAuditSummaryUseCase(repo as never);

    await expect(useCase.execute('audit-1')).resolves.toEqual(summary);
  });

  it('throws not found when audit is missing', async () => {
    const repo = {
      findSummaryById: jest.fn().mockResolvedValue(null),
    };
    const useCase = new GetAuditSummaryUseCase(repo as never);

    await expect(useCase.execute('missing-audit')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

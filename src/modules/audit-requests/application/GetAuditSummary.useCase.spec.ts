import { ResourceNotFoundError } from '../../../common/domain/errors';
import type { IAuditRequestsRepository } from '../domain/IAuditRequests.repository';
import { GetAuditSummaryUseCase } from './GetAuditSummary.useCase';
import { createMockAuditRequestsRepo } from '../../../../test/factories/audit-requests.factory';

describe('GetAuditSummaryUseCase', () => {
  let repo: jest.Mocked<IAuditRequestsRepository>;

  beforeEach(() => {
    repo = createMockAuditRequestsRepo();
  });

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
    repo.findSummaryById.mockResolvedValue(summary);
    const useCase = new GetAuditSummaryUseCase(repo);

    await expect(useCase.execute('audit-1')).resolves.toEqual(summary);
  });

  it('throws not found when audit is missing', async () => {
    repo.findSummaryById.mockResolvedValue(null);
    const useCase = new GetAuditSummaryUseCase(repo);

    await expect(useCase.execute('missing-audit')).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });
});

import { BadgesEvaluationQueueService } from './badges-evaluation-queue.service';
import type { SebastianBadgesAutomationConfig } from './badges.config';
import type { EvaluateBadgesUseCase } from '../../application/services/EvaluateBadges.useCase';

/**
 * Ces tests ne couvrent que le chemin fallback in-process (sans Redis).
 * Le chemin BullMQ est implicitement valide par la meme architecture
 * dans AuditQueueService (cf. audit-queue.service.spec).
 */
describe('BadgesEvaluationQueueService (fallback inline)', () => {
  let config: SebastianBadgesAutomationConfig;
  let evaluateBadges: jest.Mocked<Pick<EvaluateBadgesUseCase, 'execute'>>;

  const buildConfig = (
    overrides?: Partial<SebastianBadgesAutomationConfig>,
  ): SebastianBadgesAutomationConfig => ({
    queueEnabled: false,
    queueName: 'sebastian_badges_evaluation',
    queueConcurrency: 1,
    queueAttempts: 3,
    queueBackoffMs: 500,
    jobTimeoutMs: 30_000,
    dedupeWindowMs: 5_000,
    ...overrides,
  });

  beforeEach(() => {
    config = buildConfig();
    evaluateBadges = { execute: jest.fn().mockResolvedValue([]) };
  });

  it('bascule en mode inline quand la queue est desactivee', async () => {
    const service = new BadgesEvaluationQueueService(
      config,
      evaluateBadges as unknown as EvaluateBadgesUseCase,
    );

    expect(service.isQueueEnabled).toBe(false);
    await service.enqueue('user-1');
    // Laisser le setImmediate executer.
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(evaluateBadges.execute).toHaveBeenCalledWith('user-1');
  });

  it('bascule en mode inline quand REDIS_URL et REDIS_HOST sont absents', async () => {
    // Config enabled mais pas de connexion Redis buildable.
    const service = new BadgesEvaluationQueueService(
      buildConfig({ queueEnabled: true }),
      evaluateBadges as unknown as EvaluateBadgesUseCase,
    );

    expect(service.isQueueEnabled).toBe(false);
    await service.enqueue('user-2');
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(evaluateBadges.execute).toHaveBeenCalledWith('user-2');
  });

  it("ne propage pas l'erreur de EvaluateBadges en mode inline", async () => {
    evaluateBadges.execute.mockRejectedValue(new Error('db down'));
    const service = new BadgesEvaluationQueueService(
      config,
      evaluateBadges as unknown as EvaluateBadgesUseCase,
    );

    await expect(service.enqueue('user-3')).resolves.toBeUndefined();
  });
});

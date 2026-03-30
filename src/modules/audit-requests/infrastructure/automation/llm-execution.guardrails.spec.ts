import {
  DeadlineBudget,
  DeadlineExceededError,
  getSharedLlmInFlightLimiter,
  LlmInFlightLimiter,
  withHardTimeout,
} from './llm-execution.guardrails';

describe('llm-execution.guardrails', () => {
  it('enforces hard timeout before long-running work completes', async () => {
    const budget = DeadlineBudget.fromNow(500);
    const start = Date.now();

    await expect(
      withHardTimeout(
        'test-call',
        20,
        async () =>
          new Promise<string>((resolve) => {
            setTimeout(() => resolve('done'), 150);
          }),
        budget,
      ),
    ).rejects.toBeInstanceOf(DeadlineExceededError);

    expect(Date.now() - start).toBeLessThan(120);
  });

  it('caps concurrency with in-flight limiter', async () => {
    const limiter = new LlmInFlightLimiter(2);
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 8 }, () =>
        limiter.run(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 15));
          active -= 1;
        }),
      ),
    );

    expect(peak).toBeLessThanOrEqual(2);
    expect(limiter.currentInFlight).toBe(0);
  });

  describe('DeadlineBudget', () => {
    it('totalMs retourne la duree totale', () => {
      const budget = new DeadlineBudget(1000, 5000);
      expect(budget.totalMs).toBe(1000);
    });

    it('remainingMs retourne le temps restant', () => {
      const budget = new DeadlineBudget(1000, 5000);
      expect(budget.remainingMs(5600)).toBe(400);
    });

    it('elapsedMs retourne le temps ecoule', () => {
      const budget = new DeadlineBudget(1000, 5000);
      expect(budget.elapsedMs(5300)).toBe(300);
    });

    it('hasTime retourne true si du temps reste', () => {
      const budget = new DeadlineBudget(5000);
      expect(budget.hasTime()).toBe(true);
    });

    it('hasTime retourne false si le budget est epuise', () => {
      const budget = new DeadlineBudget(1, Date.now() - 1000);
      expect(budget.hasTime()).toBe(false);
    });

    it('fromNow cree un budget a partir de maintenant', () => {
      const before = Date.now();
      const budget = DeadlineBudget.fromNow(500);
      const after = Date.now();

      expect(budget.totalMs).toBe(500);
      expect(budget.remainingMs()).toBeGreaterThan(0);
      expect(budget.remainingMs()).toBeLessThanOrEqual(500);
      expect(budget.elapsedMs()).toBeGreaterThanOrEqual(0);
      expect(budget.elapsedMs()).toBeLessThanOrEqual(after - before + 50);
    });
  });

  describe('withHardTimeout', () => {
    it('retourne le resultat si la tache finit a temps', async () => {
      const result = await withHardTimeout('fast-call', 500, () =>
        Promise.resolve('succes'),
      );
      expect(result).toBe('succes');
    });

    it('lance DeadlineExceededError si pas de budget restant', async () => {
      const expiredBudget = new DeadlineBudget(1, Date.now() - 2000);

      await expect(
        withHardTimeout(
          'expired-call',
          1000,
          () => Promise.resolve('never'),
          expiredBudget,
        ),
      ).rejects.toBeInstanceOf(DeadlineExceededError);
    });

    it('abort signal est declenche au timeout', async () => {
      let signalAborted = false;

      await expect(
        withHardTimeout('abort-test', 20, async (signal) => {
          signal.addEventListener('abort', () => {
            signalAborted = true;
          });
          return new Promise<string>((resolve) => {
            setTimeout(() => resolve('too late'), 200);
          });
        }),
      ).rejects.toBeInstanceOf(DeadlineExceededError);

      expect(signalAborted).toBe(true);
    });
  });

  describe('LlmInFlightLimiter', () => {
    it('waiting retourne le nombre de taches en attente', async () => {
      const limiter = new LlmInFlightLimiter(1);
      let resolveFirst!: () => void;
      const firstBlocking = new Promise<void>((r) => {
        resolveFirst = r;
      });

      // Lancer une premiere tache qui bloque le slot
      const task1 = limiter.run(() => firstBlocking);

      // Lancer deux taches supplementaires qui doivent attendre
      const task2 = limiter.run(() => Promise.resolve(undefined));
      const task3 = limiter.run(() => Promise.resolve(undefined));

      // Attendre un tick pour que les taches entrent en file
      await new Promise((r) => setTimeout(r, 5));

      expect(limiter.waiting).toBe(2);
      expect(limiter.currentInFlight).toBe(1);

      resolveFirst();
      await Promise.all([task1, task2, task3]);

      expect(limiter.waiting).toBe(0);
      expect(limiter.currentInFlight).toBe(0);
    });

    it('libere la place apres une erreur dans la tache', async () => {
      const limiter = new LlmInFlightLimiter(1);

      await expect(
        limiter.run(() => Promise.reject(new Error('echec volontaire'))),
      ).rejects.toThrow('echec volontaire');

      expect(limiter.currentInFlight).toBe(0);

      // Le slot est de nouveau libre pour une tache suivante
      const result = await limiter.run(() => Promise.resolve('ok'));
      expect(result).toBe('ok');
    });
  });

  describe('getSharedLlmInFlightLimiter', () => {
    beforeEach(() => {
      // Nettoyer le store global entre les tests
      const storeKey = Symbol.for(
        'portfolio-2025.audit-requests.llm-inflight-limiters',
      );
      (globalThis as Record<symbol, unknown>)[storeKey] = undefined;
    });

    it('retourne le meme limiter pour le meme maxInFlight', () => {
      const limiter1 = getSharedLlmInFlightLimiter(5);
      const limiter2 = getSharedLlmInFlightLimiter(5);
      expect(limiter1).toBe(limiter2);
    });

    it('retourne un nouveau limiter pour un maxInFlight different', () => {
      const limiter1 = getSharedLlmInFlightLimiter(3);
      const limiter2 = getSharedLlmInFlightLimiter(7);
      expect(limiter1).not.toBe(limiter2);
    });
  });
});

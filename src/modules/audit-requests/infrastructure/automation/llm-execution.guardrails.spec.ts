import {
  DeadlineBudget,
  DeadlineExceededError,
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
});

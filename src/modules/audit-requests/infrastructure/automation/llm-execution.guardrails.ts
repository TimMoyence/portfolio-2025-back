export class DeadlineExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeadlineExceededError';
  }
}

export class DeadlineBudget {
  private readonly startedAtMs: number;
  private readonly deadlineAtMs: number;

  constructor(totalMs: number, nowMs = Date.now()) {
    const safeTotalMs = Math.max(1, Math.round(totalMs));
    this.startedAtMs = nowMs;
    this.deadlineAtMs = nowMs + safeTotalMs;
  }

  static fromNow(totalMs: number): DeadlineBudget {
    return new DeadlineBudget(totalMs);
  }

  get totalMs(): number {
    return this.deadlineAtMs - this.startedAtMs;
  }

  remainingMs(nowMs = Date.now()): number {
    return Math.max(0, this.deadlineAtMs - nowMs);
  }

  elapsedMs(nowMs = Date.now()): number {
    return Math.max(0, nowMs - this.startedAtMs);
  }

  hasTime(minRemainingMs = 1): boolean {
    return this.remainingMs() >= Math.max(0, minRemainingMs);
  }
}

export async function withHardTimeout<T>(
  label: string,
  timeoutMs: number,
  run: (signal: AbortSignal) => Promise<T>,
  budget?: DeadlineBudget,
): Promise<T> {
  const requestedTimeoutMs = Math.max(1, Math.round(timeoutMs));
  const remainingBudgetMs = budget
    ? budget.remainingMs()
    : Number.POSITIVE_INFINITY;
  const effectiveTimeoutMs = Math.min(requestedTimeoutMs, remainingBudgetMs);

  if (!Number.isFinite(effectiveTimeoutMs) || effectiveTimeoutMs <= 0) {
    throw new DeadlineExceededError(`${label} skipped: no deadline remaining`);
  }

  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutError = new DeadlineExceededError(
    `${label} timed out after ${effectiveTimeoutMs}ms`,
  );

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, effectiveTimeoutMs);
  });

  try {
    return await Promise.race([run(controller.signal), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export class LlmInFlightLimiter {
  private inFlight = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly maxInFlight: number) {}

  get currentInFlight(): number {
    return this.inFlight;
  }

  get waiting(): number {
    return this.queue.length;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.inFlight < this.maxInFlight) {
      this.inFlight += 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.inFlight += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}

const limiterStoreKey = Symbol.for(
  'portfolio-2025.audit-requests.llm-inflight-limiters',
);

type GlobalLimiterStore = {
  [limiterStoreKey]?: Map<number, LlmInFlightLimiter>;
};

export function getSharedLlmInFlightLimiter(
  maxInFlight: number,
): LlmInFlightLimiter {
  const safeMax = Math.max(1, Math.round(maxInFlight));
  const root = globalThis as typeof globalThis & GlobalLimiterStore;
  if (!root[limiterStoreKey]) {
    root[limiterStoreKey] = new Map<number, LlmInFlightLimiter>();
  }

  const existing = root[limiterStoreKey]?.get(safeMax);
  if (existing) return existing;

  const limiter = new LlmInFlightLimiter(safeMax);
  root[limiterStoreKey]?.set(safeMax, limiter);
  return limiter;
}

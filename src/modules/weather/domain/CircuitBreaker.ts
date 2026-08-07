export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenSuccessThreshold: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
  halfOpenSuccessThreshold: 2,
};

export class CircuitBreaker {
  private _state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private halfOpenSuccessCount = 0;
  private lastFailureTimestamp: number | null = null;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  get state(): CircuitBreakerState {
    return this._state;
  }

  canExecute(): boolean {
    if (this._state === 'CLOSED') {
      return true;
    }

    if (this._state === 'HALF_OPEN') {
      return true;
    }

    if (
      this.lastFailureTimestamp !== null &&
      Date.now() - this.lastFailureTimestamp >= this.config.resetTimeoutMs
    ) {
      this._state = 'HALF_OPEN';
      this.halfOpenSuccessCount = 0;
      return true;
    }

    return false;
  }

  recordSuccess(): void {
    if (this._state === 'HALF_OPEN') {
      this.halfOpenSuccessCount++;
      if (this.halfOpenSuccessCount >= this.config.halfOpenSuccessThreshold) {
        this._state = 'CLOSED';
        this.failureCount = 0;
        this.halfOpenSuccessCount = 0;
        this.lastFailureTimestamp = null;
      }
    } else if (this._state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    if (this._state === 'HALF_OPEN') {
      this._state = 'OPEN';
      this.halfOpenSuccessCount = 0;
      this.lastFailureTimestamp = Date.now();
      return;
    }

    this.failureCount++;
    if (this.failureCount >= this.config.failureThreshold) {
      this._state = 'OPEN';
      this.lastFailureTimestamp = Date.now();
    }
  }

  reset(): void {
    this._state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenSuccessCount = 0;
    this.lastFailureTimestamp = null;
  }
}

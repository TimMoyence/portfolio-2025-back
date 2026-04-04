/** Etats possibles du circuit breaker. */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Configuration du circuit breaker. */
export interface CircuitBreakerConfig {
  /** Nombre d'echecs consecutifs avant ouverture. */
  failureThreshold: number;
  /** Duree en ms avant passage de OPEN a HALF_OPEN. */
  resetTimeoutMs: number;
  /** Nombre de succes en HALF_OPEN pour refermer le circuit. */
  halfOpenSuccessThreshold: number;
}

/** Valeurs par defaut du circuit breaker. */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
  halfOpenSuccessThreshold: 2,
};

/**
 * Value object representant un circuit breaker.
 *
 * Gere les transitions entre les etats CLOSED, OPEN et HALF_OPEN
 * pour proteger un service externe contre les echecs en cascade.
 * Aucune dependance NestJS — logique metier pure.
 */
export class CircuitBreaker {
  private _state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private halfOpenSuccessCount = 0;
  private lastFailureTimestamp: number | null = null;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  /** Retourne l'etat courant du circuit breaker. */
  get state(): CircuitBreakerState {
    return this._state;
  }

  /**
   * Indique si une execution est autorisee.
   *
   * - CLOSED : toujours autorise.
   * - OPEN : autorise uniquement si le delai de reset est expire
   *   (transition automatique vers HALF_OPEN).
   * - HALF_OPEN : toujours autorise (on laisse passer pour tester).
   */
  canExecute(): boolean {
    if (this._state === 'CLOSED') {
      return true;
    }

    if (this._state === 'HALF_OPEN') {
      return true;
    }

    // OPEN — verifier si le timeout de reset est expire
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

  /**
   * Enregistre un succes d'execution.
   *
   * En HALF_OPEN, incremente le compteur de succes.
   * Si le seuil est atteint, referme le circuit (CLOSED).
   */
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
      // Un succes en CLOSED remet le compteur d'echecs a zero
      this.failureCount = 0;
    }
  }

  /**
   * Enregistre un echec d'execution.
   *
   * Incremente le compteur d'echecs. Si le seuil est depasse,
   * ouvre le circuit et enregistre le timestamp.
   * En HALF_OPEN, un seul echec rouvre le circuit.
   */
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

  /** Reinitialise le circuit breaker a l'etat CLOSED. */
  reset(): void {
    this._state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenSuccessCount = 0;
    this.lastFailureTimestamp = null;
  }
}

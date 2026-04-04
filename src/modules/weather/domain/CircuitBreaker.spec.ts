import {
  CircuitBreaker,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from './CircuitBreaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 1_000,
      halfOpenSuccessThreshold: 2,
    });
  });

  it('demarre en etat CLOSED', () => {
    expect(cb.state).toBe('CLOSED');
  });

  it('reste CLOSED apres des succes', () => {
    cb.recordSuccess();
    cb.recordSuccess();
    cb.recordSuccess();

    expect(cb.state).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });

  it('passe OPEN apres failureThreshold echecs consecutifs', () => {
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('CLOSED');

    cb.recordFailure();
    expect(cb.state).toBe('OPEN');
  });

  it('canExecute() retourne false si OPEN et timeout non expire', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    expect(cb.state).toBe('OPEN');
    expect(cb.canExecute()).toBe(false);
  });

  it('passe HALF_OPEN quand le timeout de reset est expire', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('OPEN');

    // Simuler l'expiration du timeout
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1_500);

    expect(cb.canExecute()).toBe(true);
    expect(cb.state).toBe('HALF_OPEN');
  });

  it('retourne CLOSED apres halfOpenSuccessThreshold succes en HALF_OPEN', () => {
    // Passer en OPEN
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    // Passer en HALF_OPEN
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1_500);
    cb.canExecute();
    expect(cb.state).toBe('HALF_OPEN');

    // Premier succes — reste HALF_OPEN
    cb.recordSuccess();
    expect(cb.state).toBe('HALF_OPEN');

    // Deuxieme succes — referme le circuit
    cb.recordSuccess();
    expect(cb.state).toBe('CLOSED');
  });

  it('retourne OPEN si echec en HALF_OPEN', () => {
    // Passer en OPEN puis HALF_OPEN
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();

    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1_500);
    cb.canExecute();
    expect(cb.state).toBe('HALF_OPEN');

    // Un echec rouvre le circuit
    cb.recordFailure();
    expect(cb.state).toBe('OPEN');
  });

  it('reset() remet tout a zero', () => {
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('OPEN');

    cb.reset();

    expect(cb.state).toBe('CLOSED');
    expect(cb.canExecute()).toBe(true);
  });

  it('un succes en CLOSED remet le compteur d echecs a zero', () => {
    cb.recordFailure();
    cb.recordFailure();
    // 2 echecs, pas encore OPEN
    expect(cb.state).toBe('CLOSED');

    cb.recordSuccess();
    // Le compteur est remis a zero, donc il faut 3 nouveaux echecs
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state).toBe('CLOSED');

    cb.recordFailure();
    expect(cb.state).toBe('OPEN');
  });

  it('utilise les valeurs par defaut si aucune config fournie', () => {
    const defaultCb = new CircuitBreaker();

    expect(defaultCb.state).toBe('CLOSED');
    // Verifier que les valeurs par defaut sont coherentes
    expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.failureThreshold).toBe(3);
    expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.resetTimeoutMs).toBe(60_000);
    expect(DEFAULT_CIRCUIT_BREAKER_CONFIG.halfOpenSuccessThreshold).toBe(2);
  });
});

import { logBootstrapStep } from './log-bootstrap-step';

describe('logBootstrapStep', () => {
  const debugInitial = process.env.BOOTSTRAP_DEBUG;
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
    if (debugInitial === undefined) {
      delete process.env.BOOTSTRAP_DEBUG;
    } else {
      process.env.BOOTSTRAP_DEBUG = debugInitial;
    }
  });

  it('trace l etape quand le debug de demarrage est actif', () => {
    process.env.BOOTSTRAP_DEBUG = 'true';

    logBootstrapStep('modules charges');

    expect(log).toHaveBeenCalledWith('[bootstrap] modules charges');
  });

  it('reste muet sinon', () => {
    process.env.BOOTSTRAP_DEBUG = 'false';

    logBootstrapStep('modules charges');

    expect(log).not.toHaveBeenCalled();
  });
});

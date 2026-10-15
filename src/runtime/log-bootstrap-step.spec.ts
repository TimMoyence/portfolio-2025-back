import {
  appliquer,
  installerVariables,
} from '../../test/helpers/environnement';
import { logBootstrapStep } from './log-bootstrap-step';

describe('logBootstrapStep', () => {
  let log: jest.SpyInstance;

  installerVariables({ BOOTSTRAP_DEBUG: undefined }, 'chaque-test');

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('trace l etape quand le debug de demarrage est actif', () => {
    appliquer({ BOOTSTRAP_DEBUG: 'true' });

    logBootstrapStep('modules charges');

    expect(log).toHaveBeenCalledWith('[bootstrap] modules charges');
  });

  it('reste muet sinon', () => {
    appliquer({ BOOTSTRAP_DEBUG: 'false' });

    logBootstrapStep('modules charges');

    expect(log).not.toHaveBeenCalled();
  });
});

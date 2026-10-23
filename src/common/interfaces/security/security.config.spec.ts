import {
  buildConfigService,
  buildValidEnv,
} from '../../../../test/factories/env.factory';
import { validateEnv } from '../../../config/env.validation';
import { loadSecurityConfig } from './security.config';

describe('loadSecurityConfig', () => {
  it.each([
    [undefined, 25],
    ['40', 40],
  ])(
    'lit le seuil de requete suspecte valide au demarrage : %j',
    (seuil, attendu) => {
      const config = buildConfigService(
        validateEnv(
          buildValidEnv({ SECURITY_SUSPICIOUS_SCORE_THRESHOLD: seuil }),
        ),
      );

      expect(loadSecurityConfig(config).suspiciousScoreThreshold).toBe(attendu);
    },
  );
});

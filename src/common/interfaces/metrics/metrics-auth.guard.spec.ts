import { ForbiddenException } from '@nestjs/common';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { buildConfigService } from '../../../../test/factories/env.factory';
import { createHttpExecutionContext } from '../../../../test/factories/execution-context.factory';
import { installerVariables } from '../../../../test/helpers/environnement';

const VALID_TOKEN = 'super-secret-metrics-token';

function verifier(tokenConfigure: string | undefined, authHeader?: string) {
  const guard = new MetricsAuthGuard(
    buildConfigService({ METRICS_TOKEN: tokenConfigure }),
  );
  const context = createHttpExecutionContext({
    headers: authHeader ? { authorization: authHeader } : {},
  });
  return () => guard.canActivate(context);
}

function attendreRefus(controle: () => boolean, message: string): void {
  expect(controle).toThrow(ForbiddenException);
  expect(controle).toThrow(message);
}

describe('MetricsAuthGuard', () => {
  it('devrait autoriser l acces avec le token exact', () => {
    expect(verifier(VALID_TOKEN, `Bearer ${VALID_TOKEN}`)()).toBe(true);
  });

  describe('absent de sa configuration, meme pose dans l environnement du processus', () => {
    installerVariables({ METRICS_TOKEN: VALID_TOKEN }, 'chaque-test');

    it('devrait refuser l acces si METRICS_TOKEN n est pas configure', () => {
      attendreRefus(
        verifier(undefined, `Bearer ${VALID_TOKEN}`),
        'Metrics endpoint not configured',
      );
    });
  });

  it('devrait refuser l acces sans header Authorization', () => {
    attendreRefus(
      verifier(VALID_TOKEN),
      'Missing or invalid Authorization header',
    );
  });

  it('devrait refuser l acces avec un header Authorization sans Bearer', () => {
    attendreRefus(
      verifier(VALID_TOKEN, 'Basic abc123'),
      'Missing or invalid Authorization header',
    );
  });

  it('devrait refuser l acces avec un token invalide', () => {
    attendreRefus(
      verifier(VALID_TOKEN, 'Bearer wrong-token'),
      'Invalid metrics token',
    );
  });

  it('devrait refuser un token de meme longueur mais 1 octet different', () => {
    const almostToken = `${VALID_TOKEN.slice(0, -1)}X`;
    expect(almostToken).toHaveLength(VALID_TOKEN.length);

    attendreRefus(
      verifier(VALID_TOKEN, `Bearer ${almostToken}`),
      'Invalid metrics token',
    );
  });
});

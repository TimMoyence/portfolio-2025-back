import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsAuthGuard } from './metrics-auth.guard';
import type { ExecutionContext } from '@nestjs/common';

function createMockContext(authHeader?: string): jest.Mocked<ExecutionContext> {
  const request = {
    headers: authHeader ? { authorization: authHeader } : {},
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as jest.Mocked<ExecutionContext>;
}

function createMockConfigService(
  metricsToken?: string,
): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockReturnValue(metricsToken),
  } as unknown as jest.Mocked<ConfigService>;
}

describe('MetricsAuthGuard', () => {
  const VALID_TOKEN = 'super-secret-metrics-token';

  it('devrait autoriser l acces avec un token valide', () => {
    const configService = createMockConfigService(VALID_TOKEN);
    const guard = new MetricsAuthGuard(configService);
    const context = createMockContext(`Bearer ${VALID_TOKEN}`);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('devrait refuser l acces si METRICS_TOKEN n est pas configure', () => {
    const configService = createMockConfigService(undefined);
    const guard = new MetricsAuthGuard(configService);
    const context = createMockContext('Bearer some-token');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Metrics endpoint not configured',
    );
  });

  it('devrait refuser l acces sans header Authorization', () => {
    const configService = createMockConfigService(VALID_TOKEN);
    const guard = new MetricsAuthGuard(configService);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing or invalid Authorization header',
    );
  });

  it('devrait refuser l acces avec un header Authorization sans Bearer', () => {
    const configService = createMockConfigService(VALID_TOKEN);
    const guard = new MetricsAuthGuard(configService);
    const context = createMockContext('Basic abc123');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing or invalid Authorization header',
    );
  });

  it('devrait refuser l acces avec un token invalide', () => {
    const configService = createMockConfigService(VALID_TOKEN);
    const guard = new MetricsAuthGuard(configService);
    const context = createMockContext('Bearer wrong-token');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Invalid metrics token');
  });
});

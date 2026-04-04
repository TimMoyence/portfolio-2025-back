import type {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

/** Construit un resultat de health check sain avec des valeurs par defaut. */
export function buildHealthyResult(
  overrides?: Partial<HealthCheckResult>,
): HealthCheckResult {
  return {
    status: 'ok',
    info: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
    },
    error: {},
    details: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
    },
    ...overrides,
  };
}

/** Construit un resultat de health check en erreur (DB inaccessible). */
export function buildUnhealthyResult(
  overrides?: Partial<HealthCheckResult>,
): HealthCheckResult {
  return {
    status: 'error',
    info: {
      memory_heap: { status: 'up' },
    },
    error: {
      database: { status: 'down' },
    },
    details: {
      database: { status: 'down' },
      memory_heap: { status: 'up' },
    },
    ...overrides,
  };
}

/** Cree un mock du HealthCheckService. */
export function createMockHealthCheckService(): jest.Mocked<HealthCheckService> {
  return {
    check: jest.fn(),
  } as unknown as jest.Mocked<HealthCheckService>;
}

/** Cree un mock du TypeOrmHealthIndicator. */
export function createMockTypeOrmHealthIndicator(): jest.Mocked<TypeOrmHealthIndicator> {
  return {
    pingCheck: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmHealthIndicator>;
}

/** Cree un mock du MemoryHealthIndicator. */
export function createMockMemoryHealthIndicator(): jest.Mocked<MemoryHealthIndicator> {
  return {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  } as unknown as jest.Mocked<MemoryHealthIndicator>;
}

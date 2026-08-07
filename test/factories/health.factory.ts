import type {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

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

export function createMockHealthCheckService(): jest.Mocked<HealthCheckService> {
  return {
    check: jest.fn(),
  } as unknown as jest.Mocked<HealthCheckService>;
}

export function createMockTypeOrmHealthIndicator(): jest.Mocked<TypeOrmHealthIndicator> {
  return {
    pingCheck: jest.fn(),
  } as unknown as jest.Mocked<TypeOrmHealthIndicator>;
}

export function createMockMemoryHealthIndicator(): jest.Mocked<MemoryHealthIndicator> {
  return {
    checkHeap: jest.fn(),
    checkRSS: jest.fn(),
  } as unknown as jest.Mocked<MemoryHealthIndicator>;
}

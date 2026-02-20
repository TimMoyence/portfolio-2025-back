import { loadAuditAutomationConfig } from './audit.config';

describe('loadAuditAutomationConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('AUDIT_') || key.startsWith('REDIS_')) {
        delete process.env[key];
      }
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads defaults when env vars are not set', () => {
    const config = loadAuditAutomationConfig();

    expect(config.queueEnabled).toBe(true);
    expect(config.queueName).toBe('audit_requests');
    expect(config.queueConcurrency).toBe(2);
    expect(config.llmProfile).toBe('parallel_sections_v1');
    expect(config.rateHourlyMin).toBe(80);
    expect(config.rateHourlyMax).toBe(120);
  });

  it('clamps numeric values to safe runtime bounds', () => {
    process.env.AUDIT_QUEUE_CONCURRENCY = '0';
    process.env.AUDIT_QUEUE_ATTEMPTS = '-1';
    process.env.AUDIT_LLM_PROFILE_CANARY_PERCENT = '250';
    process.env.AUDIT_PAGE_AI_CIRCUIT_BREAKER_FAILURE_RATIO = '8';
    process.env.AUDIT_RATE_HOURLY_MIN = '-5';
    process.env.AUDIT_RATE_HOURLY_MAX = '-1';
    process.env.REDIS_PORT = '0';

    const config = loadAuditAutomationConfig();

    expect(config.queueConcurrency).toBe(1);
    expect(config.queueAttempts).toBe(1);
    expect(config.llmProfileCanaryPercent).toBe(100);
    expect(config.pageAiCircuitBreakerFailureRatio).toBe(1);
    expect(config.rateHourlyMin).toBe(0);
    expect(config.rateHourlyMax).toBe(0);
    expect(config.redisPort).toBe(1);
  });

  it('supports sequential llm profile when explicitly requested', () => {
    process.env.AUDIT_LLM_PROFILE = 'stability_first_sequential';

    const config = loadAuditAutomationConfig();

    expect(config.llmProfile).toBe('stability_first_sequential');
  });
});

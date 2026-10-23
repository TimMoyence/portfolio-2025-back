import {
  installerVariables,
  sousEnvironnement,
} from '../../../../../test/helpers/environnement';
import { loadAuditAutomationConfig } from './audit.config';

const VARIABLES_LUES = /^(AUDIT|REDIS)_/;

describe('loadAuditAutomationConfig', () => {
  installerVariables(
    Object.fromEntries(
      Object.keys(process.env)
        .filter((nom) => VARIABLES_LUES.test(nom))
        .map((nom) => [nom, undefined]),
    ),
    'chaque-test',
  );

  const configSous = (variables: Record<string, string>) =>
    sousEnvironnement(variables, () =>
      Promise.resolve(loadAuditAutomationConfig()),
    );

  it('loads defaults when env vars are not set', () => {
    const config = loadAuditAutomationConfig();

    expect(config.queueEnabled).toBe(true);
    expect(config.queueName).toBe('audit_requests');
    expect(config.queueConcurrency).toBe(1);
    expect(config.llmProfile).toBe('parallel_sections_v1');
    expect(config.rateHourlyMin).toBe(80);
    expect(config.rateHourlyMax).toBe(120);
  });

  it('clamps numeric values to safe runtime bounds', async () => {
    const config = await configSous({
      AUDIT_QUEUE_CONCURRENCY: '0',
      AUDIT_QUEUE_ATTEMPTS: '-1',
      AUDIT_LLM_PROFILE_CANARY_PERCENT: '250',
      AUDIT_PAGE_AI_CIRCUIT_BREAKER_FAILURE_RATIO: '8',
      AUDIT_RATE_HOURLY_MIN: '-5',
      AUDIT_RATE_HOURLY_MAX: '-1',
    });

    expect(config.queueConcurrency).toBe(1);
    expect(config.queueAttempts).toBe(1);
    expect(config.llmProfileCanaryPercent).toBe(100);
    expect(config.pageAiCircuitBreakerFailureRatio).toBe(1);
    expect(config.rateHourlyMin).toBe(0);
    expect(config.rateHourlyMax).toBe(0);
  });

  it('retient la connexion Redis resolue depuis l environnement', async () => {
    expect((await configSous({ REDIS_HOST: 'cache' })).redis).toEqual({
      host: 'cache',
      port: 6379,
    });
  });

  it('supports sequential llm profile when explicitly requested', async () => {
    const config = await configSous({
      AUDIT_LLM_PROFILE: 'stability_first_sequential',
    });

    expect(config.llmProfile).toBe('stability_first_sequential');
  });
});

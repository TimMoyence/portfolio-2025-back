/* eslint-disable @typescript-eslint/unbound-method */
import { HealthCheckService } from '@nestjs/terminus';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import {
  buildHealthyResult,
  buildUnhealthyResult,
  createMockHealthCheckService,
  createMockTypeOrmHealthIndicator,
  createMockMemoryHealthIndicator,
} from '../../../../test/factories/health.factory';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthCheckService>;

  beforeEach(() => {
    healthService = createMockHealthCheckService();
    const dbIndicator = createMockTypeOrmHealthIndicator();
    const memoryIndicator = createMockMemoryHealthIndicator();

    controller = new HealthController(
      healthService,
      dbIndicator,
      memoryIndicator,
    );
  });

  it('devrait retourner un status healthy quand DB et memoire sont OK', async () => {
    const expected = buildHealthyResult();
    healthService.check.mockResolvedValue(expected);

    const result = await controller.check();

    expect(result).toEqual(expected);
    expect(result.status).toBe('ok');
    expect(healthService.check).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(Function)]),
    );
  });

  it('devrait retourner un status unhealthy quand la DB est inaccessible', async () => {
    const unhealthy = buildUnhealthyResult();
    healthService.check.mockRejectedValue(
      new ServiceUnavailableException(unhealthy),
    );

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(healthService.check).toHaveBeenCalled();
  });
});

/* eslint-disable @typescript-eslint/unbound-method */
import { GetHistoricalUseCase } from './GetHistorical.useCase';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import {
  buildHistoricalResult,
  createMockWeatherProxy,
} from '../../../../test/factories/weather.factory';

describe('GetHistoricalUseCase', () => {
  let useCase: GetHistoricalUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  beforeEach(() => {
    proxy = createMockWeatherProxy();
    useCase = new GetHistoricalUseCase(proxy);
  });

  it('devrait deleguer la recuperation des donnees historiques au proxy meteo', async () => {
    const mockResult = buildHistoricalResult();
    proxy.getHistorical.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2025-01-01',
      endDate: '2025-01-03',
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getHistorical).toHaveBeenCalledWith(
      48.8566,
      2.3522,
      '2025-01-01',
      '2025-01-03',
    );
    expect(proxy.getHistorical).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner les donnees journalieres historiques', async () => {
    const mockResult = buildHistoricalResult();
    proxy.getHistorical.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
      startDate: '2025-01-01',
      endDate: '2025-01-03',
    });

    expect(result.daily.time).toHaveLength(3);
    expect(result.daily.temperature_2m_mean).toEqual([5.2, 4.8, 6.1]);
    expect(result.daily.precipitation_sum).toEqual([0.0, 2.5, 0.8]);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getHistorical.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({
        latitude: 48.8566,
        longitude: 2.3522,
        startDate: '2025-01-01',
        endDate: '2025-01-03',
      }),
    ).rejects.toThrow('Network error');
  });
});

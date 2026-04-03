/* eslint-disable @typescript-eslint/unbound-method */
import { GetForecastUseCase } from './GetForecast.useCase';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import {
  buildForecastResult,
  createMockWeatherProxy,
} from '../../../../test/factories/weather.factory';

describe('GetForecastUseCase', () => {
  let useCase: GetForecastUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  const mockResult = buildForecastResult();

  beforeEach(() => {
    proxy = createMockWeatherProxy();
    useCase = new GetForecastUseCase(proxy);
  });

  it('devrait deleguer la recuperation des previsions au proxy meteo', async () => {
    proxy.getForecast.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
      timezone: 'Europe/Paris',
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getForecast).toHaveBeenCalledWith(
      48.8566,
      2.3522,
      'Europe/Paris',
      undefined,
    );
    expect(proxy.getForecast).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getForecast.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network error');
  });
});

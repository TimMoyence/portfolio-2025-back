/* eslint-disable @typescript-eslint/unbound-method */
import { GetForecastDetailedWeatherUseCase } from './GetForecastDetailedWeather.useCase';
import type { IOpenWeatherMapProxy } from '../domain/IOpenWeatherMapProxy.port';
import {
  buildDetailedForecastResult,
  createMockOpenWeatherMapProxy,
} from '../../../../test/factories/weather.factory';

describe('GetForecastDetailedWeatherUseCase', () => {
  let useCase: GetForecastDetailedWeatherUseCase;
  let proxy: jest.Mocked<IOpenWeatherMapProxy>;

  beforeEach(() => {
    proxy = createMockOpenWeatherMapProxy();
    useCase = new GetForecastDetailedWeatherUseCase(proxy);
  });

  it('devrait deleguer la recuperation des previsions detaillees au proxy OWM', async () => {
    const mockResult = buildDetailedForecastResult();
    proxy.getForecastDetailed.mockResolvedValue(mockResult);

    const result = await useCase.execute(48.8566, 2.3522);

    expect(result).toEqual(mockResult);
    expect(proxy.getForecastDetailed).toHaveBeenCalledWith(48.8566, 2.3522);
    expect(proxy.getForecastDetailed).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getForecastDetailed.mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute(48.8566, 2.3522)).rejects.toThrow(
      'Network error',
    );
  });
});

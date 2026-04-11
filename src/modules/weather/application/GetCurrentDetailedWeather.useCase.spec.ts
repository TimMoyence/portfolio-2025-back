/* eslint-disable @typescript-eslint/unbound-method */
import { GetCurrentDetailedWeatherUseCase } from './GetCurrentDetailedWeather.useCase';
import type { IOpenWeatherMapProxy } from '../domain/IOpenWeatherMapProxy.port';
import {
  buildDetailedCurrentWeather,
  createMockOpenWeatherMapProxy,
} from '../../../../test/factories/weather.factory';

describe('GetCurrentDetailedWeatherUseCase', () => {
  let useCase: GetCurrentDetailedWeatherUseCase;
  let proxy: jest.Mocked<IOpenWeatherMapProxy>;

  beforeEach(() => {
    proxy = createMockOpenWeatherMapProxy();
    useCase = new GetCurrentDetailedWeatherUseCase(proxy);
  });

  it('devrait deleguer la recuperation des donnees detaillees courantes au proxy OWM', async () => {
    const mockResult = buildDetailedCurrentWeather();
    proxy.getCurrentDetailed.mockResolvedValue(mockResult);

    const result = await useCase.execute(48.8566, 2.3522);

    expect(result).toEqual(mockResult);
    expect(proxy.getCurrentDetailed).toHaveBeenCalledWith(48.8566, 2.3522);
    expect(proxy.getCurrentDetailed).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getCurrentDetailed.mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute(48.8566, 2.3522)).rejects.toThrow(
      'Network error',
    );
  });
});

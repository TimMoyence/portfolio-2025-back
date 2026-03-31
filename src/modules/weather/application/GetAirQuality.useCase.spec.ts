/* eslint-disable @typescript-eslint/unbound-method */
import { GetAirQualityUseCase } from './GetAirQuality.useCase';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import {
  buildAirQualityResult,
  createMockWeatherProxy,
} from '../../../../test/factories/weather.factory';

describe('GetAirQualityUseCase', () => {
  let useCase: GetAirQualityUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  beforeEach(() => {
    proxy = createMockWeatherProxy();
    useCase = new GetAirQualityUseCase(proxy);
  });

  it("devrait deleguer la recuperation de la qualite de l'air au proxy meteo", async () => {
    const mockResult = buildAirQualityResult();
    proxy.getAirQuality.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getAirQuality).toHaveBeenCalledWith(48.8566, 2.3522);
    expect(proxy.getAirQuality).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getAirQuality.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network error');
  });
});

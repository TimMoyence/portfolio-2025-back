/* eslint-disable @typescript-eslint/unbound-method */
import { GetWeatherAlertsUseCase } from './GetWeatherAlerts.useCase';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import {
  buildWeatherAlertResult,
  createMockWeatherProxy,
} from '../../../../test/factories/weather.factory';

describe('GetWeatherAlertsUseCase', () => {
  let useCase: GetWeatherAlertsUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  beforeEach(() => {
    proxy = createMockWeatherProxy();
    useCase = new GetWeatherAlertsUseCase(proxy);
  });

  it('devrait deleguer la recuperation des alertes au proxy meteo', async () => {
    const mockResult = buildWeatherAlertResult();
    proxy.getAlerts.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getAlerts).toHaveBeenCalledWith(48.8566, 2.3522);
    expect(proxy.getAlerts).toHaveBeenCalledTimes(1);
  });

  it("devrait retourner un tableau vide quand il n'y a pas d'alertes", async () => {
    const emptyResult = buildWeatherAlertResult({ alerts: [] });
    proxy.getAlerts.mockResolvedValue(emptyResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(result.alerts).toHaveLength(0);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getAlerts.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network error');
  });
});

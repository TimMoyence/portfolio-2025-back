/* eslint-disable @typescript-eslint/unbound-method */
import { GetEnsembleUseCase } from './GetEnsemble.useCase';
import type { IWeatherProxy } from '../domain/IWeatherProxy.port';
import {
  buildEnsembleResult,
  createMockWeatherProxy,
} from '../../../../test/factories/weather.factory';

describe('GetEnsembleUseCase', () => {
  let useCase: GetEnsembleUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  beforeEach(() => {
    proxy = createMockWeatherProxy();
    useCase = new GetEnsembleUseCase(proxy);
  });

  it("devrait deleguer la recuperation des previsions d'ensemble au proxy meteo", async () => {
    const mockResult = buildEnsembleResult();
    proxy.getEnsemble.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(result).toEqual(mockResult);
    expect(proxy.getEnsemble).toHaveBeenCalledWith(48.8566, 2.3522);
    expect(proxy.getEnsemble).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner les trois modeles dans le resultat', async () => {
    const mockResult = buildEnsembleResult();
    proxy.getEnsemble.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    expect(result.models).toHaveLength(3);
    expect(result.models.map((m) => m.model)).toEqual(['ecmwf', 'gfs', 'icon']);
  });

  it('devrait inclure le CAPE dans le modele GFS', async () => {
    const mockResult = buildEnsembleResult();
    proxy.getEnsemble.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      latitude: 48.8566,
      longitude: 2.3522,
    });

    const gfs = result.models.find((m) => m.model === 'gfs');
    expect(gfs?.hourly.cape).toEqual([120, 150]);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.getEnsemble.mockRejectedValue(new Error('Network error'));

    await expect(
      useCase.execute({ latitude: 48.8566, longitude: 2.3522 }),
    ).rejects.toThrow('Network error');
  });
});

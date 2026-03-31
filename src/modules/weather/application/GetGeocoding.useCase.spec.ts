/* eslint-disable @typescript-eslint/unbound-method */
import { GetGeocodingUseCase } from './GetGeocoding.useCase';
import type {
  IWeatherProxy,
  GeocodingResult,
} from '../domain/IWeatherProxy.port';

describe('GetGeocodingUseCase', () => {
  let useCase: GetGeocodingUseCase;
  let proxy: jest.Mocked<IWeatherProxy>;

  const mockResult: GeocodingResult = {
    results: [
      {
        id: 1,
        name: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        country: 'France',
        country_code: 'FR',
        admin1: 'Ile-de-France',
      },
    ],
  };

  beforeEach(() => {
    proxy = {
      searchCity: jest.fn(),
      getForecast: jest.fn(),
      getAirQuality: jest.fn(),
      getEnsemble: jest.fn(),
      getHistorical: jest.fn(),
    };
    useCase = new GetGeocodingUseCase(proxy);
  });

  it('devrait deleguer la recherche au proxy meteo', async () => {
    proxy.searchCity.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      name: 'Paris',
      language: 'fr',
      count: 5,
    });

    expect(result).toEqual(mockResult);
    expect(proxy.searchCity).toHaveBeenCalledWith('Paris', 'fr', 5);
    expect(proxy.searchCity).toHaveBeenCalledTimes(1);
  });

  it('devrait propager les erreurs du proxy', async () => {
    proxy.searchCity.mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute({ name: 'Paris' })).rejects.toThrow(
      'Network error',
    );
  });
});
